"""Build offline Dominican province outlines from geoBoundaries ADM1."""
import json
from pathlib import Path

ROOT = Path(__file__).parent
SOURCE = ROOT / "data" / "provinces.geojson"
OUTPUT = ROOT / "web" / "provinces.js"


def simplify(points, tolerance=0.0025):
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        first, last = stack.pop()
        x1, y1 = points[first][:2]
        x2, y2 = points[last][:2]
        dx, dy = x2 - x1, y2 - y1
        norm = (dx * dx + dy * dy) ** 0.5 or 1e-12
        worst, index = 0.0, None
        for i in range(first + 1, last):
            x, y = points[i][:2]
            distance = abs(dy * (x - x1) - dx * (y - y1)) / norm
            if distance > worst:
                worst, index = distance, i
        if index is not None and worst > tolerance:
            keep[index] = True
            stack.extend(((first, index), (index, last)))
    return [[round(v, 3) for v in p[:2]] for p, retained in zip(points, keep) if retained]


def simplify_ring(ring):
    # Closed rings have identical endpoints; split them so simplification has a baseline.
    middle = len(ring) // 2
    return simplify(ring[:middle + 1]) + simplify(ring[middle:])[1:]


def main():
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    provinces = []
    for feature in source["features"]:
        geometry = feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        provinces.append({
            "name": feature["properties"].get("shapeName", ""),
            "rings": [simplify_ring(polygon[0]) for polygon in polygons if polygon and len(polygon[0]) > 2],
        })
    if len(provinces) != 32:
        raise ValueError("Expected 32 provinces; got %d" % len(provinces))
    payload = json.dumps(provinces, ensure_ascii=False, separators=(",", ":"))
    OUTPUT.write_text(
        "// geoBoundaries ADM1, Dominican Republic; public domain; represented year 2022.\n"
        "window.GT_PROVINCES = " + payload + ";\n",
        encoding="utf-8",
    )
    print("Wrote %s (%d provinces, %d KB)" % (OUTPUT, len(provinces), len(payload) // 1024))


if __name__ == "__main__":
    main()
