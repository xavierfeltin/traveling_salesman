import { ACO } from "../ACO/ant_colony_optimizer";
import { ACOParameters } from "../ACO/ant_colony";
import { ACOMinMax } from "../ACO/ant_colony_optimizer_minmax";
import { Graph } from "../graph";

export interface GenParameters {
    maxIterations: number;
    populationSize: number;
    crossoverRate: number;
    mutationRate: number;
    nbKeepBestIndividuals: number;
};

export interface Individual {
    adn: ACOParameters;
    fitness: number;
    stdFitness: number;
    probability: number;
    computationTime: number;
}

export interface Parents {
    parentA: Individual;
    parentB: Individual;
}

export interface Options {
    salesMap: Graph;
    ranges: Range;
}

export interface Range {
    alpha: {min: number; max: number};
    beta: {min: number; max: number};
    Q: {min: number; max: number};
    evaporationRate: {min: number; max: number};
    nbAnts: {min: number; max: number};
    maxIterations: {min: number; max: number};
    pBest: {min: number; max: number};
    smoothing: {min: number; max: number};
}

const isStringConstraintDuplicateMode = false;

export class Genetic {
    private parameters: GenParameters;
    private population: Individual[];
    private additionalParameters: Options;
    private mutableList: string[];
    private best!: Individual;
    private bestIndividuals: Individual[];
    private currentIteration: number;

    constructor(params: GenParameters, options: Options) {
        this.parameters = params;
        this.population = [];
        this.bestIndividuals = [];
        this.additionalParameters = options;
        this.mutableList = ["alpha", "beta", "Q", "evaporationRate", "pBest", "smoothing", "nbAnts"];
        this.currentIteration = 0;
    }

    public initialize(): void {
        this.currentIteration = 0;
        this.bestIndividuals = [];
        for (let i = 0; i < this.parameters.populationSize; i++) {
            let individual = this.generateRandomIndividual();
            while (this.isDuplicate(individual, isStringConstraintDuplicateMode)) {
                individual = this.generateRandomIndividual();
            }
            this.population.push(individual);
        }
        this.best = this.population[0];
    }

    public optimize(): Individual {

        let start = new Date().getTime();
        this.evaluate();
        let elapsed = (new Date().getTime() - start) / (1000 * 60);
        console.log("Evaluation done in : " + elapsed + "mn");

        this.sortPopulationByFitness();
        this.updateBest(this.population);

        this.printPopulation(0);

        for (let i = 1; i < this.parameters.maxIterations; i++) {
            this.evolve();
            this.sortPopulationByFitness();
            this.updateBest(this.population);

            this.printPopulation(i);            
        }

        return this.best;
    }

    private printPopulation(iteration: number): void {
        console.log(" Global best / parameters: " + JSON.stringify(this.best.adn) + ", path: " + this.best.fitness.toFixed(1) + ", time (s): " + (this.best.computationTime / 1000).toFixed(2) + ", fitness: " + this.best.stdFitness);

        for (let j = 0; j < 4; j++) {
            console.log(iteration + "-" + j + " / parameters: " + JSON.stringify(this.population[j].adn) + ", path: " + this.population[j].fitness.toFixed(1) + ", time (s): " + (this.population[j].computationTime / 1000).toFixed(2) + ", fitness: " + this.population[j].stdFitness);
        }

        for (let j = this.population.length - 3; j < this.population.length; j++) {
            console.log(iteration + "-" + j + " / parameters: " + JSON.stringify(this.population[j].adn) + ", path: " + this.population[j].fitness.toFixed(1) + ", time (s): " + (this.population[j].computationTime / 1000).toFixed(2) + ", fitness: " + this.population[j].stdFitness);
        }
    }

    public optimizeByStep(): Individual {
        if (this.currentIteration <= this.parameters.maxIterations) {
            this.evaluate();
            this.evolve();
            this.sortPopulationByFitness();
            this.updateBest(this.population);
            this.currentIteration++;
        }        
        return this.best;
    }

    public getCurrentIteration(): number {
        return this.currentIteration;
    }

    public getMaxIterations(): number {
        return this.parameters.maxIterations;
    }

    public getBestIndividual():Individual {
        this.sortPopulationByFitness();
        return this.population[0];
    }

    public getBestIndividuals(): Individual[] {
        return this.bestIndividuals;
    }

    public getSortedPopulation(): Individual[] {
        this.sortPopulationByFitness();
        return this.population;
    }

    // DESC
    private sortPopulationByFitness(): void {
        this.population.sort((a: Individual, b: Individual): number => {
            if (a.stdFitness < b.stdFitness  ) {
                return 1;
            } else if (a.stdFitness === b.stdFitness  ) {
                return 0;
            } else {
                return -1;
            }
        });
    }

    // ASC
    private sortPopulationByProbability(): void {
        this.population.sort((a: Individual, b: Individual): number => {
            if (a.probability < b.probability  ) {
                return -1;
            } else if (a.probability === b.probability) {
                return 0;
            } else {
                return 1;
            }
        });
    }
    
    private evolve() {
        this.population = this.generateNewGeneration();

        let start = new Date().getTime();
        this.evaluate();
        let elapsed = (new Date().getTime() - start) / (1000 * 60);
        console.log("Evaluation done in : " + elapsed + "mn");
    }

    private updateBest(sortedPopulation: Individual[]): void {
        if (this.best.stdFitness < sortedPopulation[0].stdFitness) {
            this.best = sortedPopulation[0];
        }
        this.bestIndividuals.push(this.best);
    }

    private selectParents(): Parents {
        const parentA = this.pickOne(this.population);
        let parentB = this.pickOne(this.population);
        while (parentB === parentA) {
            parentB = this.pickOne(this.population);
        }

        const parents = {
            parentA: parentA,
            parentB: parentB
        };

        return parents;
    }

    private pickOne(population: Individual[]): Individual {
        const rand = Math.random();
        let i = 0;
        while (i < population.length && population[i].probability <= rand) {
            i += 1;
        }

        if (i === population.length) {
            i = i - 1;
        }
        return population[i];
    }

    private mutate(individual: Individual, mutableList: string[], force: boolean): Individual {
        let rand = Math.random();
        if (!force && rand > this.parameters.mutationRate) {
            return individual;
        }

        const mutant: Individual = {
            adn: {...individual.adn},
            fitness: 0.0,
            stdFitness: 0.0,
            probability: 0.0,
            computationTime: 0.0
        };

        let index = Math.floor(Math.random() * mutableList.length);
        index = Math.min(index, mutableList.length -1);
        let property = mutableList[index] as keyof ACOParameters;

        let mutation: number;
        let randType = Math.random();
        if (randType < 0.2) { // full random mutation
            const propertyRange = mutableList[index] as keyof Range;
            const paramRange = this.additionalParameters.ranges[propertyRange];
            const isInteger = (property === "nbAnts" || property === "maxIterations"); 
            mutation = this.randomMutationInRange(paramRange.min, paramRange.max, isInteger);
            mutant.adn[property] = mutation;
        }
        else { // local mutation
            const propertyRange = mutableList[index] as keyof Range;
            const paramRange = this.additionalParameters.ranges[propertyRange];
            const isInteger = (property === "nbAnts" || property === "maxIterations"); 
            mutation = this.randomMutationInPercent(paramRange.max, 0.15, isInteger);
            
            while (mutant.adn[property] + mutation < paramRange.min || mutant.adn[property] + mutation > paramRange.max) {
                mutation = this.randomMutationInPercent(paramRange.max, 0.15, isInteger);
            }
            mutant.adn[property] += mutation;
        }

        return mutant;
    }

    private randomMutationInPercent(value: number, percent: number, isInteger: boolean): number {
        const delta = value * percent;
        return this.randomMutationInRange(-delta, delta, isInteger);
    }

    private randomMutationInRange(min: number, max: number, isInteger: boolean): number {
        let value = Math.random() * (max - min) + min;

        if (isInteger) {
            value = Math.floor(value);
        }
        else {
            value = Math.round(value * 1000.0) / 1000.0; // force 3 digits max
        }

        return value;
    }

    private crossOver(parents: Parents): Individual {
        let bestParent: Individual;
        let worstParent: Individual;
        if (parents.parentA.stdFitness > parents.parentB.stdFitness) {
            bestParent = parents.parentA;
            worstParent = parents.parentB;
        }
        else {
            bestParent = parents.parentB;
            worstParent = parents.parentA;
        }

        const deltaQuality = worstParent.stdFitness / bestParent.stdFitness;

        const child: Individual = {
            adn: {...bestParent.adn},
            fitness: 0.0,
            stdFitness: 0.0,
            probability: 0.0,
            computationTime: 0.0
        };

        const immutableList = ["gamma", "maxIterations"];
        for (const gene in parents.parentA.adn) {
            if (gene in immutableList) {
                continue;
            }

            let property = gene as keyof ACOParameters;
            let rand = Math.random();
            const crossoverRate = Math.min(deltaQuality, this.parameters.crossoverRate);
            if (rand < crossoverRate) {
                child.adn[property] = worstParent.adn[property];
            }
        }

        return child;
    }

    private generateNewGeneration(): Individual[] {
        const newPopulation: Individual[] = [];         
        const nbRandomPopulation = 3; 
        const nbChildrenToGenerate = this.parameters.populationSize - nbRandomPopulation - 1;


        // Keep best
        newPopulation.push(this.population[0]);

        /*
        // Try to mutate the best
        let nbBestIndividualsMutated = 0;
        let kept: number[] = [];
        
        const randMutateBest = Math.random();
        
        if (randMutateBest < this.parameters.mutationRate) {
            let mutant = this.mutate(this.population[0], this.mutableList, true);
            while (this.isDuplicate(mutant, isStringConstraintDuplicateMode)) {
                mutant = this.mutate(mutant, this.mutableList, true);
            }
            newPopulation.push(mutant);
            nbBestIndividualsMutated++;
        }
        */

        // Start with second individual to avoid copying first too often
        /*
        let bestKm: Individual = this.population[0];
        let bestTime: Individual = this.population[0];
        let indexKm = 0;
        let indexTime = 0;
        for (let i = 1; i < this.population.length; i++) {
            if (bestKm.fitness < this.population[i].fitness) {
                bestKm = this.population[i];
                indexKm = i;
            }

            if (bestTime.computationTime < this.population[i].computationTime) {
                bestTime = this.population[i];
                indexTime = i;
            }
        }

        if (indexKm != 0) {
            newPopulation.push(this.population[indexKm]);
        }
        

        if (indexKm != indexTime && indexTime != 0) {
            newPopulation.push(this.population[indexTime]);
        }
        
        let mutantKm = this.mutate(bestKm, ["nbAnts", "maxIterations"], true);
        while (this.isDuplicate(mutantKm, isStringConstraintDuplicateMode)) {
            mutantKm = this.mutate(mutantKm, ["nbAnts", "maxIterations"], true);
        }
        newPopulation.push(mutantKm);

        let mutantTime = this.mutate(bestTime, ["alpha", "beta", "Q", "evaporationRate", "pBest", "smoothing"], true);
        while (this.isDuplicate(mutantTime, isStringConstraintDuplicateMode)) {
            mutantTime = this.mutate(mutantTime, ["alpha", "beta", "Q", "evaporationRate", "pBest", "smoothing"], true);
        }
        newPopulation.push(mutantTime);
        */

        // Keep some others
        /*
        for (let i = 0; i < nbPopulationToKeep; i++) {
            let index = Math.floor(Math.random() * this.population.length);
            index = Math.min(index, this.population.length -1);
            while (index in kept) {
                index = Math.floor(Math.random() * this.population.length);
                index = Math.min(index, this.population.length -1);
            }
            newPopulation.push(this.population[index]);
            kept.push(index);
        }
        */

        // Random individual
        for (let i = 0; i < nbRandomPopulation; i++) {
            let individual = this.generateRandomIndividual();
            while (this.isDuplicate(individual, isStringConstraintDuplicateMode)) {
                individual = this.generateRandomIndividual();
            }
            newPopulation.push(individual);
        }

        // Generate children
        this.sortPopulationByProbability();
        for (let i = 0; i < nbChildrenToGenerate; i++) {
            const parents = this.selectParents();
            let child: Individual = this.crossOver(parents);
            child = this.mutate(child, this.mutableList, false);

            while (this.isDuplicate(child, false)) {
                child = this.crossOver(parents);
                child = this.mutate(child, this.mutableList, true);
            }

            newPopulation.push(child);
        }

        return newPopulation;
    }

    private evaluate(): void {
        for (let individual of this.population) {
            if (individual.fitness > 0) {
                continue;
            }
            let optim = new ACOMinMax(individual.adn, this.additionalParameters.salesMap);
            optim.initialize();
            let start = new Date().getTime();
            optim.optimize();
            let finish = new Date().getTime();;
            let elapsed = finish -start;
            individual.computationTime = elapsed;
            const bestSolutionFound = optim.getBestsolution();
            individual.fitness = bestSolutionFound.score;
        }

        this.convertFitnessIntoProbabilities();
    }

    private convertFitnessIntoProbabilities(): void {
        let sumFit = 0.0;
        for (let individual of this.population) {
            //let colonyTime = individual.computationTime / 40.0; //scale with path length
            let score = individual.fitness; // + colonyTime;
            individual.stdFitness = 100000 / score; // smaller values are best
            individual.stdFitness = individual.stdFitness * individual.stdFitness; // square to accentuare the gap between solutions
            sumFit += individual.stdFitness;
        }

        let previousProba = 0.0;
        for (let individual of this.population) {
            const relativeFitness = individual.stdFitness / sumFit;
            previousProba += relativeFitness;
            individual.probability = previousProba; // cumulation of probabilities for fortune of wheel
        }

        // Round last probability to 1
        const lastIndex = this.population.length - 1;
        this.population[lastIndex].probability = 1.0;
    }

    private generateRandomIndividual(): Individual {
        const alpha = this.additionalParameters.ranges.alpha;
        const beta = this.additionalParameters.ranges.beta;
        const q = this.additionalParameters.ranges.Q;
        const evaporation = this.additionalParameters.ranges.evaporationRate;
        const pBest = this.additionalParameters.ranges.pBest;
        const smoothing = this.additionalParameters.ranges.smoothing;
        const nbAnts =  this.additionalParameters.ranges.nbAnts;
        // const maxIterations =  this.additionalParameters.ranges.maxIterations;

        const adn: ACOParameters = {
            alpha: this.randomMutationInRange(alpha.min, alpha.max, false),
            beta: this.randomMutationInRange(beta.min, beta.max, false),
            gamma: 0.0,
            Q: this.randomMutationInRange(q.min, q.max, false),
            evaporationRate: this.randomMutationInRange(evaporation.min, evaporation.max, false),
            pBest: this.randomMutationInRange(pBest.min, pBest.max, false),
            smoothing: this.randomMutationInRange(smoothing.min, smoothing.max, false),
            nbAnts: this.randomMutationInRange(nbAnts.min, nbAnts.max, true),
            maxIterations: 300 //this.randomMutationInRange(maxIterations.min, maxIterations.max, true)
        };

        const individual: Individual = {
            adn: adn,
            fitness: 0.0,
            stdFitness: 0.0,
            probability: 0.0,
            computationTime: 0.0
        }

        return individual;
    }

    private isDuplicate(individual: Individual, strict: boolean): boolean {
        let thresold = strict ? this.mutableList.length - 1 : this.mutableList.length;
        let nbSameValues = 0;

        for (let i = 0; i < this.population.length; i++) {
            let isSame = false;
            nbSameValues = 0;
            for (const gene of this.mutableList) {
                const property = gene as keyof ACOParameters;
                
                if (individual.adn[property] === this.population[i].adn[property]) { 
                    nbSameValues++
                }
                
                // Same individual
                if (nbSameValues === thresold) {
                    isSame = true; 
                    break;
                } 
            }
            
            if (isSame) {
                return true;
            }
        }
        return false;
    }
}