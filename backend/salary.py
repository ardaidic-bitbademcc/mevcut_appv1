"""Small salary helpers separated for unit testing.

Provides pure functions for calculating hourly wage and earned pay.
"""

from typing import Union


def calculate_hourly_from_daily(daily_wage: Union[int, float], workday_hours: float = 9.0) -> float:
    """Calculate hourly wage from daily wage and workday hours.

    Returns rounded hourly wage with 2 decimals.
    """
    try:
        daily = float(daily_wage)
    except (TypeError, ValueError):
        raise ValueError("daily_wage must be a number")

    if workday_hours <= 0:
        raise ValueError("workday_hours must be > 0")

    return round(daily / workday_hours, 2)


def calculate_earned(hourly_rate: Union[int, float], total_hours: Union[int, float]) -> float:
    """Calculate earned pay as hourly_rate * total_hours, rounded to 2 decimals."""
    try:
        hr = float(hourly_rate)
        th = float(total_hours)
    except (TypeError, ValueError):
        raise ValueError("hourly_rate and total_hours must be numbers")

    return round(hr * th, 2)
