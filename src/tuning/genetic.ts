import { ACO, ACOParameters } from "../ACO/ant_colony_optimizer";
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
}

export class Genetic {
    private parameters: GenParameters;
    private population: Individual[];
    private additionalParameters: Options;
    private mutableList: string[];

    constructor(params: GenParameters, options: Options) {
        this.parameters = params;
        this.population = [];
        this.additionalParameters = options;
        this.mutableList = ["alpha", "beta", "Q", "evaporationRate"];
    }

    public initialize(): void {
        /*
        const adn: ACOParameters = {
            alpha: 0.9,
            beta: 1.2,
            gamma: 0.0,
            Q: 0.2,
            evaporationRate: 0.15,
            nbAnts: 30,
            maxIterations: 200
        };

        const individual: Individual = {
            adn: adn,
            fitness: 0.0,
            stdFitness: 0.0,
            probability: 0.0
        };

        this.population.push(individual);
        */

        for (let i = 0; i < this.parameters.populationSize; i++) {
            const individual = this.generateRandomIndividual();
            this.population.push(individual);
        }
    }

    public optimize(): Individual {
        this.evaluate();

        let pop = this.getSortedPopulation();
        for (let j = 0; j < 4; j++) {
            console.log(0 + "-" + j + " / parameters: " + JSON.stringify(pop[j].adn) + ", fitness: " + pop[j].fitness.toFixed(1));
        }

        for (let j = pop.length - 3; j < pop.length; j++) {
            console.log(0 + "-" + j + " / parameters: " + JSON.stringify(pop[j].adn) + ", fitness: " + pop[j].fitness.toFixed(1));
        }

        for (let i = 1; i < this.parameters.maxIterations; i++) {
            this.evolve();

            pop = this.getSortedPopulation();
            for (let j = 0; j < 4; j++) {
                console.log(i + "-" + j + " / parameters: " + JSON.stringify(pop[j].adn) + ", fitness: " + pop[j].fitness.toFixed(1));
            }

            for (let j = pop.length - 3; j < pop.length; j++) {
                console.log(i + "-" + j + " / parameters: " + JSON.stringify(pop[j].adn) + ", fitness: " + pop[j].fitness.toFixed(1));
            }
        }

        this.sortPopulationByFitness();
        return this.population[0];
    }

    // DEBUG
    public optimizeByStep(): Individual {
        this.evaluate();
        this.evolve();
        this.sortPopulationByFitness();
        return this.population[0];
    }

    public getBestIndividual():Individual {
        this.sortPopulationByFitness();
        return this.population[0];
    }

    public getSortedPopulation(): Individual[] {
        this.sortPopulationByFitness();
        return this.population;
    }

    private sortPopulationByFitness(): void {
        this.population.sort((a: Individual, b: Individual): number => {
            if (a.fitness < b.fitness) {
                return -1;
            } else if (a.fitness === b.fitness) {
                return 0;
            } else {
                return 1;
            }
        });
    }

    private evolve() {
        this.population = this.generateNewGeneration();
        this.evaluate();
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
        while (i < population.length && population[i].probability < rand) {
            i += 1;
        }

        if (i === population.length) {
            i = i - 1;
        }
        return population[i];
    }

    private mutate(individual: Individual): Individual {
        let rand = Math.random();
        if (rand > this.parameters.mutationRate) {
            return individual;
        }

        const mutant: Individual = {
            adn: {...individual.adn},
            fitness: 0.0,
            stdFitness: 0.0,
            probability: 0.0
        };

        let index = Math.floor(Math.random() * this.mutableList.length);
        index = Math.min(index, this.mutableList.length -1);
        let property = this.mutableList[index] as keyof ACOParameters;

        let mutation: number;
        let randType = Math.random();
        if (randType < 0.1) {
            const propertyRange = this.mutableList[index] as keyof Range;
            const paramRange = this.additionalParameters.ranges[propertyRange];
            mutation = this.randomMutationInRange(paramRange.min, paramRange.max);
            mutant.adn[property] = mutation;
        }
        else {
            mutation = this.randomMutationInRange(-0.5,0.5);

            // parameters can not be negative => todo code a range of valid values
            const propertyRange = this.mutableList[index] as keyof Range;
            const paramRange = this.additionalParameters.ranges[propertyRange];
            while (mutant.adn[property] + mutation < paramRange.min || mutant.adn[property] + mutation > paramRange.max) {
                mutation = this.randomMutationInRange(-0.5, 0.5);
            }
            mutant.adn[property] += mutation;
        }

        return mutant;
    }

    private randomMutationInRange(min: number, max: number): number {
        let value = Math.random() * (max - min) + min;
        value = Math.round(value * 1000.0) / 1000.0; // force 3 digits max
        return value;
    }

    private crossOver(parents: Parents): Individual {
        let bestParent: Individual;
        let worstParent: Individual;
        if (parents.parentA.fitness > parents.parentB.fitness) {
            bestParent = parents.parentA;
            worstParent = parents.parentB;
        }
        else {
            bestParent = parents.parentB;
            worstParent = parents.parentA;
        }

        const deltaQuality = worstParent.fitness / bestParent.fitness;

        const child: Individual = {
            adn: {...bestParent.adn},
            fitness: 0.0,
            stdFitness: 0.0,
            probability: 0.0
        };

        const immutableList = ["nbAnts", "maxIterations", "gamma"];
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
        const nbChildrenToGenerate = Math.floor(this.parameters.populationSize * 0.9) - 1; // 1 random individual
        const nbPopulationToKeep = this.parameters.populationSize - nbChildrenToGenerate - 1; // Keep the best always

        // Keep best
        newPopulation.push(this.population[0]);

        // Keep some others
        let kept: number[] = [0];
        for (let i = 0; i < nbPopulationToKeep; i++) {
            let index = Math.floor(Math.random() * this.population.length);
            index = Math.min(index, this.population.length -1);
            while (index in kept) {
                index = Math.floor(Math.random() * this.population.length);
                index = Math.min(index, this.population.length -1);
            }
            newPopulation.push(this.population[index]);
        }

        // Try to mutate the best in case of
        let nbBestIndividualsMutated = 0;
        const randMutateBest = Math.random();
        if (randMutateBest < 0.1) {
            const mutant = this.mutate(this.population[0]);
            newPopulation.push(mutant);
            nbBestIndividualsMutated++;
        }

        // Random individual
        const individual = this.generateRandomIndividual();
        newPopulation.push(individual);

        for (let i = 0; i < nbChildrenToGenerate - nbBestIndividualsMutated; i++) {
            const parents = this.selectParents();
            let child: Individual = this.crossOver(parents);
            child = this.mutate(child);
            newPopulation.push(child);
        }

        return newPopulation;
    }

    private evaluate(): void {
        for (let individual of this.population) {
            if (individual.fitness > 0) {
                continue;
            }
            let optim = new ACO(individual.adn, this.additionalParameters.salesMap);
            optim.initialize();
            optim.optimize();
            const bestSolutionFound = optim.getBestsolution();
            individual.fitness = bestSolutionFound.score;
        }

        this.sortPopulationByFitness();
        this.convertFitnessIntoProbabilities();
    }

    private convertFitnessIntoProbabilities(): void {
        let sumFit = 0.0;
        for (let individual of this.population) {
            individual.stdFitness = 1.0 / individual.fitness; // smaller values are best
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

        const adn: ACOParameters = {
            alpha: this.randomMutationInRange(alpha.min, alpha.max),
            beta: this.randomMutationInRange(beta.min, beta.max),
            gamma: 0,
            Q: this.randomMutationInRange(q.min, q.max),
            evaporationRate: this.randomMutationInRange(evaporation.min, evaporation.max),
            nbAnts: 50,
            maxIterations: 500
        }

        const individual: Individual = {
            adn: adn,
            fitness: 0.0,
            stdFitness: 0.0,
            probability: 0.0
        }

        return individual;
    }
}