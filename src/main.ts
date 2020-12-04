import { ACOParameters } from './ACO/ant_colony';
import { ACOMinMax } from './ACO/ant_colony_optimizer_minmax';
import { ChartOptimRenderer } from './chartRenderer';
import { Graph } from './graph';

// Load map information from JSON stored in data
import * as jsonMap from '../data/berlin52.json';
import { MapRenderer } from './mapRenderer';
import { Genetic, GenParameters, Options } from './tuning/genetic';
let salesMap = Graph.loadFromJSON(jsonMap);

let ctx: CanvasRenderingContext2D | null = null;
let ctxChart: CanvasRenderingContext2D | null = null;

const canvas = <HTMLCanvasElement> document.getElementById('area');
const canvasChart = <HTMLCanvasElement> document.getElementById('chart');

const searchButton = document.getElementById("searchbutton");
const solveButton = document.getElementById("solvebutton");
const solveTurnButton = document.getElementById("solveturnbutton");
const trainingArea = document.getElementById("training");
const infoArea = document.getElementById("info");

const parametersInputValues: number[] = [];
const parametersNames: string[] = ["alpha", "beta", "gamma", "q", "evaporation", "pBest", "smoothing", "ants", "iterations"];
for (let name of parametersNames) {
    const inputElement = <HTMLInputElement> document.getElementById(name);
    parametersInputValues.push(parseFloat(inputElement.value));
}

let parameters: ACOParameters = {
    alpha: parametersInputValues[0], //0.9,
    beta: parametersInputValues[1], //1.2,
    gamma: parametersInputValues[2], //0.0,
    Q: parametersInputValues[3], //0.2,
    evaporationRate: parametersInputValues[4], //0.15,
    pBest: parametersInputValues[5],
    smoothing: parametersInputValues[6],
    nbAnts: parametersInputValues[7], //30,
    maxIterations: parametersInputValues[8] //500
};

//let optim = new ACO(parameters, salesMap);
let optim: ACOMinMax = new ACOMinMax(parameters, salesMap);
//optim.initialize();


let genParameters: GenParameters = {
    maxIterations: 30,
    populationSize: 20,
    crossoverRate: 0.9, // use smart crossover
    mutationRate: 0.3,
    nbKeepBestIndividuals: 1
};

let genOptions: Options = {
    salesMap: salesMap,
    ranges: {
        alpha: {min: 0.0, max: 100.0},
        beta: {min: 0.0, max: 100.0},
        Q: {min: 0.0, max: 10.0},
        evaporationRate: {min: 0.0, max: 1.0},
        pBest: {min: 0.6, max: 1.0},
        smoothing: {min: 0.0, max: 1.0},
        nbAnts: {min: 20, max: 60},
        maxIterations: {min: 50, max: 300}
    }
};
let ag = new Genetic(genParameters, genOptions);
ag.initialize();

let chart: Chart;
let map: Chart;

// Rendering
if (canvas && canvas.getContext('2d')) {

    if (!ctx) {
        ctx = canvas.getContext('2d');
    }

    if (ctx) {
        //Renderer.render(ctx, optim, true, false);
        map = MapRenderer.initialize(ctx, optim.getProblem());
    }

}

if (canvasChart && canvasChart.getContext('2d')) {

    if (!ctxChart) {
        ctxChart = canvasChart.getContext('2d');
    }

    if (ctxChart) {
        chart = ChartOptimRenderer.initialize(ctxChart, optim);
    }
}

// Optimization
if (solveButton) {
    solveButton.addEventListener("click", (e:Event) => {
        const parametersInputValues: number[] = [];
        const parametersNames: string[] = ["alpha", "beta", "gamma", "q", "evaporation", "pBest", "smoothing", "ants", "iterations"];
        for (let name of parametersNames) {
            const inputElement = <HTMLInputElement> document.getElementById(name);
            parametersInputValues.push(parseFloat(inputElement.value));
        }

        parameters = {
            alpha: parametersInputValues[0], //0.9,
            beta: parametersInputValues[1], //1.2,
            gamma: parametersInputValues[2], //0.0,
            Q: parametersInputValues[3], //0.2,
            evaporationRate: parametersInputValues[4], //0.15,
            pBest: parametersInputValues[5],
            smoothing: parametersInputValues[6],
            nbAnts: parametersInputValues[7], //30,
            maxIterations: parametersInputValues[8] //500
        };

        //let optim = new ACO(parameters, salesMap);
        optim = new ACOMinMax(parameters, salesMap);
        optim.initialize();

        solve();
    });
}

if (solveTurnButton) {
    solveTurnButton.addEventListener("click", (e:Event) => {
        solveTurn();
   });
}

if (searchButton) {
    // launch tuning of ACO parameters
    searchButton.addEventListener("click", (e:Event) => {
        tuneParameters();
   });
}

async function solve() {
    console.log("Parameters: " + JSON.stringify(parameters));
    for (let i = 0; i < parameters.maxIterations; i++)
    {
        optim.optimizeTurn();
        let bestSolution = optim.getBestsolution();
        let mostMarked = optim.getMostMarkedSolution();

        if (trainingArea) {
            trainingArea.innerHTML = "<p> " + optim.getCurrentIteration() + " / " +  optim.getMaxIterations() + "</p>";
            trainingArea.innerHTML += "<p> Best path: " + bestSolution.path.join(', ') + "</p>";
            trainingArea.innerHTML += "<p> Best score: " + bestSolution.score + "m / 7542 (m) for Berlin52</p>";
            trainingArea.innerHTML += "<p> Most Marked path: " + mostMarked.path.join(', ') + "</p>";
            trainingArea.innerHTML += "<p> Most Marked score: " + mostMarked.score + "m / 7542 (m) for Berlin52 </p>";
        }

        if (infoArea) {
            let iterations = optim.getBestSolutions();
            let resultHTMLToDisplay = "";
            let idx = 1;
            for (let it of iterations) {
                resultHTMLToDisplay += "<p> It " + idx + " : " + it.path.join(', ');
                resultHTMLToDisplay += " - score: " + it.score + "m </p>";
                idx++;
            }
            infoArea.innerHTML = resultHTMLToDisplay;
        }

        if (ctx) {
            //Renderer.render(ctx, optim, false, true);
            MapRenderer.render(map, optim.getProblem(), optim.getBestsolution().path);
        }

        if (ctxChart) {
            const paths = optim.getBestSolutions();
            const scores = [];
            for(const path of paths) {
                scores.push(path.score);
            }
            ChartOptimRenderer.render(chart, scores);
        }

        await sleep(500);
    }
}

function solveTurn() {
    optim.optimizeTurn();
    let bestSolution = optim.getBestsolution();
    let mostMarked = optim.getMostMarkedSolution();

    if (trainingArea) {
        trainingArea.innerHTML = "<p> " + optim.getCurrentIteration() + " / " +  optim.getMaxIterations() + "</p>";
        trainingArea.innerHTML += "<p> Best path: " + bestSolution.path.join(', ') + "</p>";
        trainingArea.innerHTML += "<p> Best score: " + bestSolution.score + "m / 7542 (m) for Berlin52</p>";
        trainingArea.innerHTML += "<p> Most Marked path: " + mostMarked.path.join(', ') + "</p>";
        trainingArea.innerHTML += "<p> Most Marked score: " + mostMarked.score + "m / 7542 (m) for Berlin52 </p>";
    }

    if (infoArea) {
        let iterations = optim.getBestSolutions();
        let resultHTMLToDisplay = "";
        let idx = 1;
        for (let it of iterations) {
            resultHTMLToDisplay += "<p> It " + idx + " : " + it.path.join(', ');
            resultHTMLToDisplay += " - score: " + it.score + "m </p>";
            idx++;
        }
        infoArea.innerHTML = resultHTMLToDisplay;
    }

    if (ctx) {
        //Renderer.render(ctx, optim, false, true);
        MapRenderer.render(map, optim.getProblem(), optim.getBestsolution().path);
    }

    if (ctxChart) {
        const paths = optim.getBestSolutions();
        const scores = [];
        for(const path of paths) {
            scores.push(path.score);
        }
        ChartOptimRenderer.render(chart, scores);
    }
}

async function tuneParameters() {
    for (let i = 0; i < ag.getMaxIterations(); i++)
    {
        ag.optimizeByStep();
        let bestSolution = ag.getBestIndividual();

        if (trainingArea) {
            trainingArea.innerHTML = "<p> " + ag.getCurrentIteration() + " / " +  ag.getMaxIterations() + "</p>";
            trainingArea.innerHTML += "<p> Best path length: " + bestSolution.fitness + "</p>";
            trainingArea.innerHTML += "<p> Best fitness: " + bestSolution.stdFitness + "</p>";
            trainingArea.innerHTML += "<p> Best parameters: " + JSON.stringify(bestSolution.adn) + "</p>";
        }

        if (infoArea) {
            let individuals = ag.getBestIndividuals();
            let resultHTMLToDisplay = "";
            let idx = 1;
            for (let ind of individuals) {
                resultHTMLToDisplay += "<p> It " + idx + " : " + JSON.stringify(ind.adn);
                resultHTMLToDisplay += " - fitness: " + ind.fitness + "m </p>";
                idx++;
            }
            infoArea.innerHTML = resultHTMLToDisplay;
        }

        if (ctx) {
            //MapRenderer.render(map, optim.getProblem(), optim.getBestsolution().path);
        }

        if (ctxChart) {
            const individuals = ag.getBestIndividuals();
            const scores = [];
            for(const ind of individuals) {
                scores.push(ind.stdFitness);
            }
            ChartOptimRenderer.render(chart, scores);
        }

        await sleep(500);
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
