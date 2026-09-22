import numpy as np


def initialize(seed=7, pixels=4, latent=2, actions=1):
    """Tiny tanh learner for inspecting every derivative."""
    rng = np.random.default_rng(seed)
    width = 2 * latent + 2 * actions
    return {
        "encoder": rng.normal(0, 0.2, (pixels, latent)),
        "enc_bias": np.zeros(latent),
        "predictor": rng.normal(0, 0.1, (width, latent)),
        "pred_bias": np.zeros(latent),
    }


def forward(params, observations, actions):
    """observations: [B, 3, P]; actions: [B, 2, A]."""
    z = np.tanh(observations @ params["encoder"] + params["enc_bias"])
    context = np.concatenate(
        [z[:, 0], z[:, 1], actions[:, 0], actions[:, 1]], axis=-1
    )
    prediction = z[:, 1] + context @ params["predictor"]
    prediction = prediction + params["pred_bias"]
    return z, context, prediction

