from engine.scoring import round_half_up


def test_round_half_up_rounds_two_and_a_half_to_three() -> None:
    assert round_half_up(2.5) == 3


def test_round_half_up_rounds_just_below_half_down() -> None:
    assert round_half_up(3.49) == 3
