import { Graph, Link, Node } from '../graph';
import { Ant } from './ant_travelling_salesman';

export interface PheromoneCoverage {
    origin: string,
    destination: string,
    pheromones: number
};

export interface ACOParameters {
    alpha: number,
    beta: number,
    gamma: number,
    Q: number,
    evaporationRate: number,
    nbAnts: number,
    maxIterations: number;
    pBest: number;
    smoothing: number;
}

export class ACOMeta {
    protected params: ACOParameters;
    protected currentIteration: number = 0;
    
    protected solutions: string[][];
    protected bestSolution: string[];
    protected bestScore: number;
    protected bestIterationSolutions: string[][];
    protected bestIterationScores: number[];
    protected mostMarkedSolution: string[];
    protected mostMarkedScore: number;

    protected ants: Ant[];
    protected problem: Graph;

    constructor(acoParams: ACOParameters, toOptimize: Graph) {
        this.params = {
            nbAnts: acoParams.nbAnts,
            maxIterations: acoParams.maxIterations,
            alpha: acoParams.alpha,
            beta: acoParams.beta,
            evaporationRate: acoParams.evaporationRate,
            Q: acoParams.Q,
            gamma: acoParams.gamma,
            pBest: 0.0,
            smoothing: 0.0
        };

        this.solutions = [];
        this.bestSolution = [];
        this.bestScore = Infinity;
        this.bestIterationSolutions = [];
        this.bestIterationScores = [];
        this.mostMarkedSolution = [];
        this.mostMarkedScore = 0;
        this.ants = [];
        this.problem = toOptimize.copy();
    }

    public initialize(): void {
        this.ants = [];
        this.solutions = [];
        const links = this.problem.getLinks();
        for (let link of links) {
            link.pheromones = this.params.gamma;
            link.iterationPheromones = 0.0;
        }

        // Initialize solutions
        this.bestSolution = [];
        this.bestScore = Infinity

        this.bestIterationSolutions = [];
        this.bestIterationScores = [];

        this.mostMarkedSolution = [];
        this.mostMarkedScore = 0;
    }

    public getProblem(): Graph {
        return this.problem;
    }

    public getBestsolution(): {path: string[], score: number} {
        return {
            path: this.bestSolution,
            score: this.bestScore
        };
    }

    public getBestSolutions(): {path: string[], score: number}[] {
        let solutions = [];
        for (let i =  0; i < this.bestIterationSolutions.length; i++) {
            solutions.push({
                path: this.bestIterationSolutions[i],
                score: this.bestIterationScores[i]
            });
        }
        return solutions;
    }

    public getSolutions(): string[][] {
        return this.solutions;
    }

    public getMostMarkedSolution(): {path: string[], score: number} {
        return {
            path: this.mostMarkedSolution,
            score: this.mostMarkedScore
        };
    }

    public getCurrentIteration(): number {
        return this.currentIteration;
    }

    public getMaxIterations(): number {
        return this.params.maxIterations;
    }

    public getPheromonesCoverage(): PheromoneCoverage[] {
        let coverage: PheromoneCoverage[] = [];
        const links: Link[] = this.problem.getLinks();
        for (let l of links) {
            coverage.push({
                origin: l.origin.label,
                destination: l.destination.label,
                pheromones: l.pheromones
            });
        }
        return coverage;
    }

    public optimize(): void  {
        for (let i = 0; i < this.params.maxIterations; i++)
        {
            this.optimizeTurn();
        }
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

        this.updatePheromones();

        this.updateBestSolution();
        this.updateMostMarkedPath();

        this.currentIteration++;
    }

    protected initializeIteration(): void {
        this.solutions = [];
        this.ants = [];
        const links = this.problem.getLinks();
        for (let link of links) {
            link.iterationPheromones = 0.0;
        }
    }

    protected updatePheromones(): void {

        for (let s of this.solutions) {
            this.updateLocalPheromones(s);
        }

        // Evaporate existing pheromones
        this.updateGlobalPheromones();
    }

    protected updateLocalPheromones(s: string[]): void {
        let pathLength = 0;
        for (let i = 0; i < s.length - 1; i++)
        {
            const origin = s[i];
            const destination = s[i+1];

            let link = this.problem.getLink(origin, destination);
            if (link) {pathLength += link.weight};
        }

        // Update pheromones
        for (let i = 0; i < s.length - 1; i++)
        {
            const origin = s[i];
            const destination = s[i+1];

            let link = this.problem.getLink(origin, destination);
            if (link) {
                //link.iterationPheromones += this.Q / pathLength;
                link.pheromones += this.params.Q / pathLength;
            }
        }        
    }

    protected updateGlobalPheromones(): void {
        const links = this.problem.getLinks();
        for (let link of links) {
            //link.pheromones = (1 - this.evaporation) * link.pheromones + link.iterationPheromones;
            link.pheromones = (1 - this.params.evaporationRate) * link.pheromones;
        }
    }

    protected updateBestSolution(): void {
        let score = 0;
        let bestSolution: string[] = [];
        let bestScore = Infinity;

        for (let s of this.solutions) {

            score = 0;
            for (let i = 0; i < s.length - 1; i++)
            {
                const origin = s[i];
                const destination = s[i+1];

                let link = this.problem.getLink(origin, destination);
                if (link) {score += link.weight;}
            }

            if (score < bestScore) {
                bestScore = score;
                bestSolution = [...s];
            }
        }

        this.bestIterationSolutions.push(bestSolution);
        this.bestIterationScores.push(bestScore);

        if (bestScore < this.bestScore) {
            this.bestScore = bestScore;
            this.bestSolution = bestSolution;
        }
    }

    protected updateMostMarkedPath(): void {
        let remainingCities = this.problem.getNodes();
        let bestPath = this.getBestsolution();
        const startingPoint = bestPath.path[0];
        let path = [startingPoint];
        let score = 0;

        remainingCities = remainingCities.filter((n: Node) => {
            return n.label !== startingPoint;
        })

        let currentCity = startingPoint;
        while (remainingCities.length > 0) {
            let maxPheromone = 0.0;
            let maxWeight = 0.0;
            let maxCity = remainingCities[0];
            for (let city of remainingCities) {
                let link = this.problem.getLink(currentCity, city.label);
                if (link && link.pheromones > maxPheromone) {
                    maxPheromone = link.pheromones;
                    maxCity = city;
                    maxWeight = link.weight;
                }
            }

            path.push(maxCity.label);
            score += maxWeight;

            remainingCities = remainingCities.filter((n: Node) => {
                return n.label !== maxCity.label;
            })

            currentCity = maxCity.label;
        }

        let link = this.problem.getLink(currentCity, startingPoint);
        path.push(startingPoint);
        if (link) {score += link.weight};

        this.mostMarkedSolution = path;
        this.mostMarkedScore = score;
    }
}