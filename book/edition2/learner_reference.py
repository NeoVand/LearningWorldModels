import numpy as np
from model_reference import forward
from sigreg_reference import sigreg, sigreg_gradient


def loss_and_grad(params, observations, actions, directions, weight=0.01):
    z, context, prediction = forward(params, observations, actions)
    batch, _, latent = z.shape
    error = prediction - z[:, 2]
    prediction_loss = np.mean(error**2)
    regularizer = sum(sigreg(z[:, t], directions) for t in range(3)) / 3
    loss = prediction_loss + weight * regularizer

    dp = 2 * error / (batch * latent)
    grad = {
        "predictor": context.T @ dp,
        "pred_bias": dp.sum(axis=0),
    }
    dc = dp @ params["predictor"].T
    dz = np.zeros_like(z)
    dz[:, 0] = dc[:, :latent]
    dz[:, 1] = dp + dc[:, latent:2 * latent]
    dz[:, 2] = -dp  # The target encoder receives gradients too.
    for t in range(3):
        dz[:, t] += weight * sigreg_gradient(z[:, t], directions) / 3
    dr = dz * (1 - z**2)  # Derivative of tanh.
    flat_obs = observations.reshape(-1, observations.shape[-1])
    grad["encoder"] = flat_obs.T @ dr.reshape(-1, latent)
    grad["enc_bias"] = dr.sum(axis=(0, 1))
    return loss, grad
