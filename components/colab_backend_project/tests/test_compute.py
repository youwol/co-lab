import numpy as np

from colab_backend.implementation import ClassicalSolver, TDSESolver
from colab_backend.schemas import Gaussian


def test_harmonic_oscillator():
    N = 1001
    x = np.linspace(0,1, N)
    solver = TDSESolver.create(
        e_pot = 1e6*(x-0.5)**2,
        psi0=Gaussian(
            x0=0.45,
            sigma=0.05
        ),
        basis_size=200
    )
    state = solver.run(1e-4)
    assert(3500 < state.energy < 4000)


def test_harmonic_oscillator_classical():
    N = 1001
    x = np.linspace(0,1, N)

    e_pot = 1e6*(x-0.5)**2
    solver = ClassicalSolver(x0=0.45,e_pot=e_pot)
    states = solver.run(t=1e-4, dt=1e-6)
    assert(len(states) == 100)