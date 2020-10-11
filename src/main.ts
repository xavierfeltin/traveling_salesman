import { ACO, ACOParameters } from './ACO/ant_colony_optimizer';
import { ChartOptimRenderer } from './chartRenderer';
import { Graph } from './graph';
import { Renderer } from './renderer';

let ctx: CanvasRenderingContext2D | null = null;
let ctxChart: CanvasRenderingContext2D | null = null;

const canvas = <HTMLCanvasElement> document.getElementById('area');
const canvasChart = <HTMLCanvasElement> document.getElementById('chart');

const solveButton = document.getElementById("solvebutton");
const solveTurnButton = document.getElementById("solveturnbutton");
const trainingArea = document.getElementById("training");
const infoArea = document.getElementById("info");

let salesMap = Graph.generate();
let nbMaxIterations = 50;
let parameters: ACOParameters = {
    alpha: 1.0,
    beta: 1.0,
    gamma: 1.0E-4,
    Q: 1.0,
    evaporationRate: 0.5,
    nbAnts: 5,
    maxIterations: nbMaxIterations
}; 
let optim = new ACO(parameters, salesMap);
optim.initialize();

let chart: Chart;

// Rendering
if (canvas && canvas.getContext('2d')) {

    if (!ctx) {
        ctx = canvas.getContext('2d');
    }

    if (ctx) {
        Renderer.render(ctx, optim, true, false);
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

async function solve() {    
    for (let i = 0; i < nbMaxIterations; i++)
    {
        optim.optimizeTurn();
        let bestSolution = optim.getBestsolution();
        debugger;
        let mostMarked = optim.getMostMarkedSolution();
        
        if (trainingArea) {
            trainingArea.innerHTML = "<p> " + optim.getCurrentIteration() + " / " +  optim.getMaxIterations() + "</p>";
            trainingArea.innerHTML += "<p> Best path: " + bestSolution.path.join(', ') + "</p>";
            trainingArea.innerHTML += "<p> Best score: " + bestSolution.score + "km </p>";
            trainingArea.innerHTML += "<p> Most Marked path: " + mostMarked.path.join(', ') + "</p>";
            trainingArea.innerHTML += "<p> Most Marked score: " + mostMarked.score + "km </p>";
        }      

        if (infoArea) {
            let iterations = optim.getBestSolutions();
            let resultHTMLToDisplay = "";
            let idx = 1;
            for (let it of iterations) {
                resultHTMLToDisplay += "<p> It " + idx + " : " + it.path.join(', ');
                resultHTMLToDisplay += " - score: " + it.score + "km </p>";
                idx++;
            }
            infoArea.innerHTML = resultHTMLToDisplay;
        }
        
        if (ctx) {
            Renderer.render(ctx, optim, false, true);
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
        trainingArea.innerHTML += "<p> Best score: " + bestSolution.score + "km </p>";
        trainingArea.innerHTML += "<p> Most Marked path: " + mostMarked.path.join(', ') + "</p>";
        trainingArea.innerHTML += "<p> Most Marked score: " + mostMarked.score + "km </p>";
    }      

    if (infoArea) {
        let iterations = optim.getBestSolutions();
        let resultHTMLToDisplay = "";
        let idx = 1;
        for (let it of iterations) {
            resultHTMLToDisplay += "<p> It " + idx + " : " + it.path.join(', ');
            resultHTMLToDisplay += " - score: " + it.score + "km </p>";
            idx++;
        }
        infoArea.innerHTML = resultHTMLToDisplay;
    }
    
    if (ctx) {
        Renderer.render(ctx, optim, false, true);
    }

    if (ctxChart) {
        ChartOptimRenderer.render(chart, optim);
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
