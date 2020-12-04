import { Graph } from '../graph';
import { Ant } from './ant_travelling_salesman';
import { ACOMeta, ACOParameters } from './ant_colony';

export class ACOMinMax extends ACOMeta {

    private nRootpBest: number;
    private tauMax: number;
    private tauMin: number;

    constructor(acoParams: ACOParameters, toOptimize: Graph) {        
        super(acoParams, toOptimize);
        this.params.pBest = acoParams.pBest;
        this.params.smoothing = acoParams.smoothing;
        this.nRootpBest = 0;
        this.tauMax = -Infinity;
        this.tauMin = Infinity;

        //console.log("Parameters: " + JSON.stringify(params));
    }

    public initialize(): void {
        this.ants = [];
        this.solutions = [];
        const links = this.problem.getLinks();
        for (let link of links) {
            link.pheromones = 0.0;
            link.iterationPheromones = 0.0;
        }
        
        const n = this.problem.getNodesLabel().length;
        this.nRootpBest = Math.pow(this.params.pBest,  1/n);

        // Initialize solutions
        this.bestSolution = [];
        this.bestScore = Infinity

        this.bestIterationSolutions = [];
        this.bestIterationScores = [];

        this.mostMarkedSolution = [];
        this.mostMarkedScore = 0;
    }

    public optimizeTurn(): void {
        if (this.currentIteration == this.params.maxIterations) {
            return;
        }

        this.initializeIteration();

        this.solutions = [];
        for (let i = 0 ; i < this.params.nbAnts; i++) {

            // console.log("Ants n°" + i);

            let ant = new Ant(this.params.alpha, this.params.beta, this.params.gamma);
            this.ants.push(ant);
            let solution = ant.randomWalk(this.problem);
            // console.log("solution: " + solution.join(", "));
            this.solutions.push(solution);
        }

        this.updateBestSolution();

        this.updateMinMaxThresolds();
        this.updatePheromones();

        this.updateMostMarkedPath();

        this.currentIteration++;
    }

    protected updatePheromones(): void {

        // Use iteration best except every 10 runs use global best
        const s = this.currentIteration % 10 === 0 ? this.bestSolution : this.bestIterationSolutions[this.bestIterationSolutions.length - 1];
        this.updateLocalPheromones(s);   

        // Evaporate existing pheromones
        this.updateGlobalPheromones();
    }

    private smoothTrail(trail: number): number {
        return trail + this.params.smoothing * (this.tauMax - trail); // delta may become a parameter later
    }

    protected updateLocalPheromones(s: string[]): void {
        let pathLength = 0;
        for (let i = 0; i < s.length - 1; i++)
        {
            const origin = s[i];
            const destination = s[i+1];

            let link = this.problem.getLink(origin, destination);
            if (link) {
                pathLength += link.weight
            };
        }

        // Update pheromones
        const pheromoneAnt = this.params.Q / pathLength;
        for (let i = 0; i < s.length - 1; i++)
        {
            const origin = s[i];
            const destination = s[i+1];
            let link = this.problem.getLink(origin, destination);
            if (link) {                
                link.pheromones += pheromoneAnt;
            }

            link = this.problem.getLink(destination, origin);
            if (link) {                
                link.pheromones += pheromoneAnt;
            }
        }       
    }

    protected updateGlobalPheromones(): void {
        const links = this.problem.getLinks();
        for (let link of links) {

           if (this.currentIteration === 0) {
               // Use tauMax for "first iteration" with the global best solution
               link.pheromones = this.tauMax;
           }
           else {
               //link.pheromones = (1 -this.evaporation) * link.pheromones + link.iterationPheromones;  
               
               //console.log("global update pheromones: " + link.origin.label + " => "  + link.destination.label + ": " + link.pheromones);

               link.pheromones = (1 - this.params.evaporationRate) * link.pheromones;
               link.pheromones = this.smoothTrail(link.pheromones);

               link.pheromones = Math.max(this.tauMin, link.pheromones);
               link.pheromones = Math.min(this.tauMax, link.pheromones);
            }     
        }   
    }

    private updateMinMaxThresolds():  void {
        const newTauMax = (1.0 / (1.0 - this.params.evaporationRate)) * (1 / this.bestScore);
        if (this.tauMax != newTauMax) {
            this.tauMax = newTauMax; // global best solution has changed
        }

        const n = this.bestSolution.length;        
        const avg = n / 2.0; 
        const newTauMin = (this.tauMax * (1 - this.nRootpBest)) / ((avg - 1.0) * this.nRootpBest);
        
        if (this.tauMin != newTauMin) {
            this.tauMin = newTauMin; // global best solution has changed
        }

        // Upper bound of tauMin
        if (this.tauMin > this.tauMax) {
            this.tauMin = this.tauMax;
        }
    }    
}