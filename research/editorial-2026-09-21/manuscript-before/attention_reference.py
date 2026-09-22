import numpy as np


def attention(x, wq, wk, wv, causal=True):
    """One head. x: [tokens, features]."""
    q, k, v = x @ wq, x @ wk, x @ wv
    scores = q @ k.T / np.sqrt(q.shape[-1])
    if causal:
        future = np.triu(np.ones(scores.shape, dtype=bool), k=1)
        scores = np.where(future, -np.inf, scores)
    scores = scores - scores.max(axis=-1, keepdims=True)
    weights = np.exp(scores)
    weights = weights / weights.sum(axis=-1, keepdims=True)
    return weights @ v, weights
