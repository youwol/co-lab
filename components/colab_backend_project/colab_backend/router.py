"""
Module gathering the definition of endpoints.
"""

import time

import numpy as np
from fastapi import APIRouter, Depends
from starlette.requests import Request
from starlette.responses import Response

from colab_backend.environment import Configuration, Environment
from colab_backend.implementation import (
    ClassicalSolver,
    FloatArray,
    TDSESolver,
    compute_eigen,
    to_pdf,
)
from colab_backend.schemas import (
    EigenStatesBody,
    EigenStatesResponse,
    State,
    TDSE1DBody,
    TDSE1DResponse,
)

router = APIRouter()
"""
The router object.
"""


@router.get("/")
async def home():
    """
    When proxied through py-youwol, this end point is always triggered when
    testing whether a backend is listening.
    """
    return Response(status_code=200)


@router.post("/schrodinger/eigen-states", response_model=EigenStatesResponse)
async def eigen_states(
    request: Request,
    body: EigenStatesBody,
    config: Configuration = Depends(Environment.get_config),
) -> EigenStatesResponse:
    """
    Computes the first eigenstates of a given potential energy function up until a given index.

    Parameters:
        request: Incoming request.
        body: System description.
        config: Injected backend configuration.

    Returns:
        Eigenstates and eigenvalues description.
    """

    async with config.context(request).start(
        action="/doc/quick-tour/eigen-states"
    ) as ctx:
        e_pot: FloatArray = np.array(body.ePot)
        eigen_values, eigen_vectors = compute_eigen(e_pot=e_pot)
        await ctx.info(f"Compute eigenstates up to {body.basisSize}")
        return EigenStatesResponse(
            eigenStates=[
                State(energy=eigen_values[i], pdf=to_pdf(eigen_vectors.T[i]).tolist())
                for i in range(0, body.basisSize)
            ]
        )


@router.post("/schrodinger/tdse-1d", response_model=TDSE1DResponse)
async def tdse_1d(
    request: Request,
    body: TDSE1DBody,
    config: Configuration = Depends(Environment.get_config),
) -> TDSE1DResponse:
    """
    Solve the Time Dependant Schrödinger Equation for a given system and initial condition.

    Parameters:
        request: Incoming request.
        body: System description.
        config: Injected backend configuration.

    Returns:
        Simulation results.
    """

    async with config.context(request).start(action="/doc/quick-tour/TDSE-1D") as ctx:

        solver = TDSESolver.create(body.ePot, body.psi0, body.basisSize)
        states = []
        await ctx.info(text="Solve tdse 1D motion")
        for i in range(0, int(body.tFinal / body.dt)):
            t0 = time.time()
            state = solver.run(body.dt * i)
            print(
                f"Iteration {i}, energy={state.energy}, compute time={time.time() - t0}"
            )
            states.append(state)
        await ctx.info(text="Solve classical motion")
        e_pot = np.array(body.ePot)
        solver_classical = ClassicalSolver(x0=body.psi0.x0, e_pot=e_pot)
        classical_states = solver_classical.run(t=body.tFinal, dt=body.dt)
        return TDSE1DResponse(quantumStates=states, classicalStates=classical_states)
