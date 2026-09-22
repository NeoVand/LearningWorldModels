import numpy as np


def cem(cost, horizon, action_dim, seed=3, rounds=8, samples=128, elites=16):
    """cost takes [samples, horizon, action_dim] and returns [samples]."""
    rng = np.random.default_rng(seed)
    mean = np.zeros((horizon, action_dim))
    std = np.ones_like(mean)
    best, best_cost = mean.copy(), np.inf
    for _ in range(rounds):
        plans = np.clip(
            mean + std * rng.normal(size=(samples, horizon, action_dim)), -1, 1
        )
        values = cost(plans)
        order = np.argsort(values)
        if values[order[0]] < best_cost:
            best, best_cost = plans[order[0]].copy(), values[order[0]]
        chosen = plans[order[:elites]]
        mean = chosen.mean(axis=0)
        std = np.maximum(chosen.std(axis=0), 0.03)
    return best, best_cost
