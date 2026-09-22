import numpy as np


def adam_step(params, grads, state, rate=0.001, beta1=0.9, beta2=0.99):
    """Mutates weights and optimizer state; epsilon is explicit."""
    state["step"] = state.get("step", 0) + 1
    t = state["step"]
    for name, value in params.items():
        m, v = state.setdefault(name, (np.zeros_like(value), np.zeros_like(value)))
        m *= beta1
        m += (1 - beta1) * grads[name]
        v *= beta2
        v += (1 - beta2) * grads[name]**2
        corrected_m = m / (1 - beta1**t)
        corrected_v = v / (1 - beta2**t)
        value -= rate * corrected_m / (np.sqrt(corrected_v) + 1e-8)
