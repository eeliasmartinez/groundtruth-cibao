"""Charts for the climate section.

Every chart compares two things and always uses the same two colors:
blue for what was measured, gray for the reference (normal or trend).
"""

import altair as alt
import pandas as pd

MEASURED = "#3987e5"  # blue
REFERENCE = "#898781"  # gray
HEIGHT = 260


def _colors(measured_label, reference_label):
    return alt.Color(
        "series:N",
        scale=alt.Scale(
            domain=[measured_label, reference_label], range=[MEASURED, REFERENCE]
        ),
        legend=alt.Legend(title=None, orient="top"),
    )


def _table(x_values, values, label):
    return pd.DataFrame({"x": list(x_values), "value": list(values), "series": label})


def _x_axis(order, x_type):
    # Keep the given order; hide labels that would overlap on a small screen.
    return alt.X(
        f"x:{x_type}",
        sort=order,
        title=None,
        axis=alt.Axis(labelAngle=0, labelOverlap=True),
    )


def _tooltip(x_type, unit, decimals):
    return [
        alt.Tooltip(f"x:{x_type}", title=" "),
        alt.Tooltip("series:N", title="  "),
        alt.Tooltip("value:Q", title=unit, format=f".{decimals}f"),
    ]


def bars_vs_reference(
    x_values, measured, reference, measured_label, reference_label, unit, x_type="N"
):
    """Blue bars for the measured values, a gray mark for the reference."""
    order = list(x_values)
    x = _x_axis(order, x_type)
    y = alt.Y("value:Q", title=unit)
    color = _colors(measured_label, reference_label)
    tooltip = _tooltip(x_type, unit, 0)

    bars = (
        alt.Chart(_table(order, measured, measured_label))
        .mark_bar(cornerRadiusTopLeft=4, cornerRadiusTopRight=4)
        .encode(x=x, y=y, color=color, tooltip=tooltip)
    )
    marks = (
        alt.Chart(_table(order, reference, reference_label))
        .mark_tick(thickness=3)
        .encode(x=x, y=y, color=color, tooltip=tooltip)
    )
    return (bars + marks).properties(height=HEIGHT)


def lines_vs_reference(
    x_values, measured, reference, measured_label, reference_label, unit, x_type="N"
):
    """Blue line with dots for the measured values, dashed gray line for the reference."""
    order = list(x_values)
    x = _x_axis(order, x_type)
    y = alt.Y("value:Q", title=unit, scale=alt.Scale(zero=False))
    color = _colors(measured_label, reference_label)
    tooltip = _tooltip(x_type, unit, 1)

    reference_line = (
        alt.Chart(_table(order, reference, reference_label))
        .mark_line(strokeWidth=2, strokeDash=[5, 4])
        .encode(x=x, y=y, color=color, tooltip=tooltip)
    )
    measured_line = (
        alt.Chart(_table(order, measured, measured_label))
        .mark_line(strokeWidth=2.5, point=alt.OverlayMarkDef(size=60, filled=True))
        .encode(x=x, y=y, color=color, tooltip=tooltip)
    )
    return (reference_line + measured_line).properties(height=HEIGHT)
