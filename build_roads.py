"""Build the small offline Autopista Duarte overlay from a saved OSRM response."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).parent
SOURCE = ROOT / "data" / "duarte_osrm.json"
OUTPUT = ROOT / "web" / "roads.js"


def simplify(points, tolerance=0.00012):
    """Douglas-Peucker in degrees; small tolerance keeps the road shape on screen."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        first, last = stack.pop()
        x1, y1 = points[first]
        x2, y2 = points[last]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy) or 1e-12
        worst, index = 0.0, None
        for i in range(first + 1, last):
            x, y = points[i]
            distance = abs(dy * (x - x1) - dx * (y - y1)) / norm
            if distance > worst:
                worst, index = distance, i
        if index is not None and worst > tolerance:
            keep[index] = True
            stack.extend(((first, index), (index, last)))
    return [[round(x, 5), round(y, 5)] for (x, y), retained in zip(points, keep) if retained]


def main():
    response = json.loads(SOURCE.read_text(encoding="utf-8"))
    steps = [step for leg in response["routes"][0]["legs"] for step in leg["steps"]
             if "duarte" in step.get("name", "").lower()]
    if not steps:
        raise ValueError("OSRM response contains no named Autopista Duarte steps")

    coordinates = []
    for step in steps:
        line = step["geometry"]["coordinates"]
        if coordinates and line:
            gap_m = math.hypot((coordinates[-1][0] - line[0][0]) * 104, (coordinates[-1][1] - line[0][1]) * 111) * 1000
            if gap_m > 25:
                raise ValueError("Named highway steps do not join (gap %.0f m)" % gap_m)
        if coordinates and line and coordinates[-1] == line[0]:
            coordinates.extend(line[1:])
        else:
            coordinates.extend(line)
    if len(coordinates) < 2:
        raise ValueError("The highway geometry is incomplete")

    route_km = sum(step["distance"] for step in steps) / 1000
    points = simplify(coordinates)
    OUTPUT.write_text(
        "// Generated from data/duarte_osrm.json. Route geometry: © OpenStreetMap contributors (ODbL).\n"
        "window.GT_ROADS = { duarte: " + json.dumps(points, separators=(",", ":")) +
        ", distanceKm: " + str(round(route_km, 2)) + " };\n",
        encoding="utf-8",
    )
    print("Wrote %s: %d points from %d source points, %.2f km" %
          (OUTPUT, len(points), len(coordinates), route_km))


if __name__ == "__main__":
    main()
