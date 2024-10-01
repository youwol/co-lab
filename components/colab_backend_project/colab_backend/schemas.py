"""
Module gathering the schemas of bodies and responses of the end points.
"""

from pydantic import BaseModel


class Gaussian(BaseModel):
    """
    Initial gaussian wave-packet representation.
    """

    x0: float
    """
    Gaussian's mean.
    """
    sigma: float
    """
    Gaussian's width.
    """


class EigenStatesBody(BaseModel):
    """
    Body to the endpoint `/doc/quick-tour/eigen-states`.
    """

    ePot: list[float]
    """
    Potential energies on the grid.
    """

    basisSize: int
    """
    Basis size cutoff.
    """


class TDSE1DBody(EigenStatesBody):
    """
    Body to the endpoint `/schrodinger/tdse-1d``.
    """

    tFinal: float
    """
    Simulation time.
    """

    dt: float
    """
    Time step.
    """

    psi0: Gaussian
    """
    Initial gaussian wave function.
    """


class State(BaseModel):
    """
    Body to the endpoint `/doc/quick-tour/compute`.
    """

    pdf: list[float]
    """
    Probability density function for each points of the grid.
    """

    energy: float
    """
    Total energy.
    """


class EigenStatesResponse(BaseModel):
    """
    Response of the endpoint `/schrodinger/eigen-states`.
    """

    eigenStates: list[State]


class ClassicalState(BaseModel):
    """
    Classical state description.
    """

    x: float
    """
    Position.
    """
    v: float
    """
    Velocity.
    """
    energy: float
    """
    Energy.
    """


class TDSE1DResponse(BaseModel):
    """
    Response model for the endpoint `/schrodinger/tdse-1d`.
    """

    quantumStates: list[State]
    """
    List of (quantum) states for the computed times.
    """
    classicalStates: list[ClassicalState]
    """
    List of classical states for the computed times.
    """
