"""
This module gathers implementation logics.
"""

# third parties
import numpy as np
from numpy.typing import NDArray

from colab_backend.schemas import ClassicalState, Gaussian, State

FloatArray = NDArray[np.float64]
"""
Type alias for array of float.
"""
ComplexArray = NDArray[np.complex64]
"""
Type alias for array of complex.
"""


def initial_wave_function(x: FloatArray, x0: float, sigma: float, k0: float):
    """
    Construct a Gaussian wave packets.

    Parameters:
        x: grid.
        x0: center of the Gaussian.
        sigma: Gaussian's width.
        k0: phase (in `exp(1j*k0*x)`)
    """
    psi0 = np.exp(-((x - x0) ** 2) / (2 * sigma**2)) * np.exp(1j * k0 * x)
    psi0 /= np.linalg.norm(psi0)
    return psi0


def compute_eigen(e_pot: FloatArray):
    """
    Compute the eigenstates of a given potential energy field.
    Well explained <a href="https://www.youtube.com/watch?v=ay0zZ8SUMSk" target="_blank">here</a>.

    Parameters:
        e_pot: Potential energies on a regular grid.

    Returns:
        Tuple (eigen-values, eigen-states)
    """
    dx = 1 / len(e_pot)
    d = 1 / dx**2 + e_pot[1:-1]
    e = -1 / (2 * dx**2) * np.ones(len(d) - 1)
    tri_diag = np.diag(d) + np.diag(e, k=1) + np.diag(e, k=-1)
    eigenvalues, eigenvectors = np.linalg.eigh(tri_diag)
    return eigenvalues, eigenvectors


class TDSESolver:
    """
    Solve the time dependant Schrodinger equation.

    For explanation:
    <a href=
    "https://www.reddit.com/r/Physics/comments/o4u1ko/the_timedependent_schrodinger_equation_for"
    target="_blank"></a>.
    """

    def __init__(self, psi_0: ComplexArray, e_pot: FloatArray, basis_size: int):
        """
        Parameters:
            psi_0: initial wave function on a regular grid.
            e_pot: Potential energy values on a regular grid (consistent with `psi_0`).
        """
        self.x: FloatArray = np.linspace(0, 1, len(e_pot))
        """
        Grid.
        """
        self.psi_0: ComplexArray = psi_0
        """
        Initial wave function.
        """
        self.e_pot: FloatArray = e_pot
        """
        Potential energy on the grid.
        """
        self.basis_size: int = basis_size
        """
        Basis size.
        """
        eigen_values, eigen_vectors = compute_eigen(e_pot=e_pot)
        self.eigen_values: FloatArray = eigen_values
        """
        Eigen values.
        """
        self.eigen_vectors: ComplexArray = eigen_vectors
        """
        Eigen vectors.
        """

        self.__psi_js = np.pad(
            eigen_vectors.T[0:basis_size], [(0, 0), (1, 1)], mode="constant"
        )
        self.cs0 = np.dot(self.__psi_js, psi_0)
        """
        Coefficients of `psi0` projected on the first `basis_size` eigen states.
        """

    def run(self, t: float) -> State:
        """
        Run the simulation up until `t`.

        Parameters:
            t: Final time.

        Returns:
            Final state.
        """
        psi_t = self.__psi_js.T @ (
            self.cs0 * np.exp(-1j * self.eigen_values[0 : self.basis_size] * t)
        )
        psi_t /= np.linalg.norm(psi_t)
        total_energy = 0

        for i in range(0, self.basis_size):
            coef_i = psi_t[1:-1].dot(self.eigen_vectors.T[i])
            total_energy += np.abs(coef_i) ** 2 * self.eigen_values[i]

        return State(pdf=to_pdf(psi_t).tolist(), energy=total_energy)

    @staticmethod
    def create(
        e_pot: list[float] | FloatArray, psi0: Gaussian, basis_size: int
    ) -> "TDSESolver":
        """
        Helpers to construct the solver.

        Parameters:
            e_pot: Potential energies value on a regular grid.
            psi0: Initial Gaussian like wave function's parameters.
            basis_size: Basis size truncation.

        Returns:
            The solver.
        """
        x = np.linspace(0, 1, len(e_pot))
        psi_0 = initial_wave_function(x=x, x0=psi0.x0, sigma=psi0.sigma, k0=0)
        solver = TDSESolver(psi_0=psi_0, e_pot=np.array(e_pot), basis_size=basis_size)
        return solver


def to_pdf(psi: ComplexArray) -> FloatArray:
    """
    Compute the Probability Density Function of a wave function.

    Parameters:
        psi: Wave function.

    Returns:
        The PDF.
    """
    prob_density = np.abs(psi) ** 2
    total_probability = np.sum(prob_density)
    return prob_density / total_probability


class ClassicalSolver:
    """
    Classical solver for particle's motion trajectory in unit-less system.

    Use Runge-Kutta 4 method to integrate over time.
    """

    def __init__(self, x0: float, e_pot: FloatArray):
        """
        Parameters:
            x0: initial position
            e_pot: Potential energy values on a regular grid.
        """
        self.x = np.linspace(0, 1, len(e_pot))
        """
        Grid.
        """
        self.x0 = x0
        """
        Initial position.
        """
        self.e_pot = e_pot
        """
        Potential energy values on the grid.
        """
        self.initial_conditions = np.array([x0, 0])
        """
        Initial position, velocity.
        """
        self.force = -np.gradient(self.e_pot, self.x)
        """
        Forces on the grid.
        """

    def run(self, t: float, dt: float) -> list[ClassicalState]:
        """
        Run the simulation up until `t` by increment of `dt`.

        Parameters:
            t: Final time.
            dt: time increment.

        Returns:
            The states at each time increment.
        """

        def equations_of_motion(state):
            x, v = state  # position and velocity
            dxdt = v
            dvdt = np.interp(x, self.x, self.force)
            return np.array([dxdt, dvdt])

        t_values = np.arange(0, t, dt)
        y_values = np.zeros((len(t_values), len(self.initial_conditions)))
        y_values[0] = self.initial_conditions
        energies = np.zeros(len(t_values))

        # Runge-Kutta integration (RK4 method)
        for i in range(1, len(t_values)):
            y = y_values[i - 1]

            k1 = dt * equations_of_motion(y)
            k2 = dt * equations_of_motion(y + k1 / 2)
            k3 = dt * equations_of_motion(y + k2 / 2)
            k4 = dt * equations_of_motion(y + k3)

            y_values[i] = y + (k1 + 2 * k2 + 2 * k3 + k4) / 6
            position, velocity = y_values[i]
            kinetic_energy = 0.5 * velocity**2
            potential_energy = np.interp(position, self.x, self.e_pot)
            total_energy = kinetic_energy + potential_energy
            energies[i] = total_energy

        return [
            ClassicalState(x=y_values[i][0], v=y_values[i][1], energy=energies[i])
            for i in range(1, len(t_values))
        ]
