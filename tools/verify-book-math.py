from pathlib import Path
import sys, json
import numpy as np
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'book/edition2'))
from learner_reference import initialize, loss_and_grad
from attention_reference import attention
from optimizer_reference import adam_step
from planning_reference import cem
rng = np.random.default_rng(21)
params = initialize(); obs = rng.normal(size=(5,3,4)); actions = rng.normal(size=(5,2,1))
directions = rng.normal(size=(2,7)); directions /= np.linalg.norm(directions,axis=0)
loss,grads = loss_and_grad(params,obs,actions,directions)
errors = {}
for name,value in params.items():
    worst = 0
    for idx in np.ndindex(value.shape):
        old=value[idx]; eps=1e-5
        value[idx]=old+eps; plus=loss_and_grad(params,obs,actions,directions)[0]
        value[idx]=old-eps; minus=loss_and_grad(params,obs,actions,directions)[0]
        value[idx]=old
        worst=max(worst,abs((plus-minus)/(2*eps)-grads[name][idx]))
    errors[name]=worst
assert max(errors.values())<1e-7,errors
state={}
for _ in range(100):
    current,g=loss_and_grad(params,obs,actions,directions)
    adam_step(params,g,state,rate=.003)
final=loss_and_grad(params,obs,actions,directions)[0]
assert final<loss
x=rng.normal(size=(4,3)); matrices=[rng.normal(size=(3,2)) for _ in range(3)]
y,w=attention(x,*matrices); x2=x.copy();x2[-1]+=100
y2,_=attention(x2,*matrices)
assert np.allclose(w.sum(axis=-1),1)
assert np.all(w[np.triu_indices(4,1)]==0)
assert np.allclose(y[:-1],y2[:-1])
rho=.2
cost=lambda plans:(plans.sum(axis=(1,2))-1)**2+rho*(plans**2).sum(axis=(1,2))
best,score=cem(cost,2,1,rounds=15,samples=256,elites=32)
opt=np.full((2,1),1/(2+rho)); exact=cost(opt[None])[0]
assert score-exact<2e-4
C=np.array([[2.,1.],[1.,2.]])
assert np.allclose(np.linalg.eigvalsh(C),[1,3])
report=dict(analytic_parameter_gradient_max_errors=errors,reference_training=dict(initial=float(loss),final=float(final),steps=100),causal_attention=dict(row_sum_error=float(np.max(abs(w.sum(-1)-1))),future_leakage=float(np.max(abs(y[:-1]-y2[:-1])))),cem_quadratic=dict(actions=best.tolist(),cost=float(score),analytic_cost=float(exact),gap=float(score-exact)),covariance_eigenvalues=np.linalg.eigvalsh(C).tolist())
(root/'research/full-book/math-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
