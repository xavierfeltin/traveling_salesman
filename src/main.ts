import { ACO, ACOParameters } from './ACO/ant_colony_optimizer';
import { ChartOptimRenderer } from './chartRenderer';
import { Graph } from './graph';
import { Renderer } from './renderer';

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
const parametersNames: string[] = ["alpha", "beta", "gamma", "q", "evaporation", "ants", "iterations"];
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
    nbAnts: parametersInputValues[5], //30,
    maxIterations: parametersInputValues[6] //500
};
let optim = new ACO(parameters, salesMap);
optim.initialize();


let genParameters: GenParameters = {
    maxIterations: 30,
    populationSize: 20,
    crossoverRate: 0.5,
    mutationRate: 0.05,
    nbKeepBestIndividuals: 1
};

let genOptions: Options = {
    salesMap: salesMap
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
            ChartOptimRenderer.render(chart, optim);
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
        ChartOptimRenderer.render(chart, optim);
    }
}

function tuneParameters() {
    const bestIndividual = ag.optimize();    
    console.log("parameters: " + JSON.stringify(bestIndividual.adn) + ", fitness: " + bestIndividual.fitness + ", proba: " + bestIndividual.probability);
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
