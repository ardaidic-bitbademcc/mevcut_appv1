import pytest

from backend.salary import calculate_hourly_from_daily, calculate_earned


def test_calculate_hourly_from_daily_basic():
    assert calculate_hourly_from_daily(90, 9) == 10.0
    assert calculate_hourly_from_daily(100, 10) == 10.0


def test_calculate_hourly_invalid_inputs():
    with pytest.raises(ValueError):
        calculate_hourly_from_daily('abc')

    with pytest.raises(ValueError):
        calculate_hourly_from_daily(100, 0)


def test_calculate_earned_basic():
    assert calculate_earned(10, 8) == 80.0
    assert calculate_earned(12.345, 2) == round(12.345 * 2, 2)


def test_calculate_earned_invalid():
    with pytest.raises(ValueError):
        calculate_earned('x', 5)

    with pytest.raises(ValueError):
        calculate_earned(10, 'y')
