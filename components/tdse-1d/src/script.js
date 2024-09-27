const webpm = window["webpm"];
const {backend, rxjs, d3} = await webpm.install({
   esm:[
        'rxjs#^7.5.6 as rxjs',
        'd3#^7.7.0 as d3'
   ],
    backends:{
        modules:[
            'colab_backend#0.1.0 as backend',
        ],
        partition: 'Default'
  },
  displayLoadingScreen: true,
})

const numPoints = 500

const grid = Array
    .from({ length: numPoints }, (_, i) => i / (numPoints - 1))

function gaussianWell({depth, mean, sigma}) {
    return x => depth * (1 - Math.exp(-(Math.pow(x - mean, 2)) / (2 * Math.pow(sigma, 2))))
}
const scenarios = {
    harmonic: {
        V:(x) =>  1e4 * (x-0.5) ** 2,
        tFinal: 1,
        dt:0.002,
        yScaleTDSE:3,
        psi0:{
            x0: 0.4,
            sigma: 0.05
        }
    },
    gaussian: {
        V: gaussianWell({depth:1e4, mean:0.5, sigma:0.1}),
        tFinal: 0.1,
        dt:0.0002,
        yScaleTDSE:3,
        psi0:{
            x0: 0.45,
            sigma: 0.05
        }
    },
    tunneling: {
        V: (x) =>  gaussianWell({depth:1e4, mean:0.25, sigma:0.1})(x) +
            gaussianWell({depth:3e4, mean:0.6, sigma:0.1})(x),
        tFinal: 0.05,
        dt:0.0001,
        yScaleTDSE:3,
        psi0:{
            x0: 0.2,
            sigma: 0.05
        }
    }
}
const scenario = scenarios.tunneling

const V = grid.map(scenario.V)

const svg = d3.select("body").append('svg').attr('width', '100%').attr('height', '100%')
svg.append('text').attr('x', '50%').attr('y', '25px').text('Computation pending...').attr('id', 'pending')
const width = document.body.offsetWidth
const height = document.body.offsetHeight
console.log({width, height})
const xScale = d3.scaleLinear()
    .domain([0, 1])
    .range([50, width - 50]);

const ePlotMin = d3.min(V)
const ePlotMax = d3.max(V) + 0.1*(d3.max(V)-d3.min(V))
const yScale = d3.scaleLinear()
    .domain([ePlotMin, ePlotMax])
    .range([height - 50, 50]);


function init_plot(){

    const epotPlt = d3.line()
        .x((d, i) => xScale(grid[i]))
        .y((d, i) => yScale(V[i]))
        .curve(d3.curveLinear)

    svg.append("path").datum(V).attr("class", "line").attr("d", epotPlt);

    svg.append("g")
        .attr("transform", `translate(0, ${height - 50})`)
        .call(d3.axisBottom(xScale).ticks(0));

    svg.append("g")
        .attr("transform", `translate(50, 0)`)
        .call(d3.axisLeft(yScale).ticks(0));

    svg.append('path').datum([]).attr('class', 'psi');

    svg.append('circle').attr('class', 'classical').attr('id', 'classical');
}


function plot({state, update, pdfScale, coef}) {
    const y0 = yScale(state.energy)
    let line = d3.line().x((d, i) => xScale(grid[i])).y(d => y0 + coef * pdfScale(d));
    if(update){
        svg.select('.psi').datum(state.pdf).attr('d', line)
        return
    }
    svg.append('path').datum(state.pdf).attr('d', line).attr('class', 'eigenstate');
}

init_plot()

const {eigenStates} = await backend.fetchJson(
    'schrodinger/eigen-states',
    {   method: 'post',
        body: JSON.stringify({
            "basisSize": 50,
            "ePot": V
        }),
        headers: { 'content-type': 'application/json' }
    })

const pdf0Max = d3.max(eigenStates[0].pdf)
const deltaE0 = yScale(eigenStates[1].energy) - yScale(eigenStates[0].energy)
const pdfScale =  d3.scaleLinear().domain([0, pdf0Max]).range([0, deltaE0]); // deltaE0 / pdf0Max

eigenStates.forEach((state) => {
    if(state.energy<ePlotMax){
        plot({state, update: false, pdfScale, coef:1 })
    }
})

const body = {   method: 'post',
    body: JSON.stringify({
        "basisSize": 200,
        "tFinal": scenario.tFinal,
        "dt": scenario.dt,
        "ePot": V,
        "psi0": scenario.psi0
    }),
    headers: { 'content-type': 'application/json' }
}

const resp = await backend.fetchJson('schrodinger/tdse-1d', body)

document.getElementById('pending').remove()
let psiMax

rxjs.timer(0,100).subscribe((i)=> {
    const index = i % resp.quantumStates.length
    const state = resp.quantumStates[index]
    psiMax = psiMax || d3.max(state.pdf)
    plot({state, pdfScale, update: true, coef: scenario.yScaleTDSE});

    const classical = resp.classicalStates[index]
    svg.select('.classical')
        .attr('cx', () => xScale(classical.x))
        .attr('cy', () => yScale(classical.energy))
        .attr('r', 5)
})
