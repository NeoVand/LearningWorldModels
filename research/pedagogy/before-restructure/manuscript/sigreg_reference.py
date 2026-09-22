import numpy as np


def sigreg(z, directions, knots=17, limit=3.0):
    """z: [B, d]; unit directions: [d, M]. Returns a scalar."""
    batch = z.shape[0]
    omega = np.linspace(0.0, limit, knots)       # [K]
    delta = limit / (knots - 1)
    target = np.exp(-0.5 * omega**2)            # [K]
    weights = np.full(knots, 2.0 * delta)
    weights[[0, -1]] = delta                   # symmetric trapezoid
    weights *= target                         # Gaussian window

    h = z @ directions                        # [B, M]
    phase = h[:, :, None] * omega[None, None, :]  # [B, M, K]
    c = np.cos(phase).mean(axis=0)              # [M, K]
    s = np.sin(phase).mean(axis=0)              # [M, K]
    error = (c - target)**2 + s**2              # [M, K]
    return batch * (error * weights).sum(axis=-1).mean()


def sigreg_gradient(z, directions, knots=17, limit=3.0):
    """Analytic gradient of exactly the finite sum above: [B, d]."""
    omega = np.linspace(0.0, limit, knots)
    delta = limit / (knots - 1)
    target = np.exp(-0.5 * omega**2)
    weights = np.full(knots, 2.0 * delta)
    weights[[0, -1]] = delta
    weights *= target
    phase = (z @ directions)[:, :, None] * omega
    c = np.cos(phase).mean(axis=0)
    s = np.sin(phase).mean(axis=0)
    grad_h = (2 * weights * omega * (
        -(c - target) * np.sin(phase) + s * np.cos(phase)
    )).sum(axis=-1) / directions.shape[1]       # [B, M]
    return grad_h @ directions.T              # [B, d]
