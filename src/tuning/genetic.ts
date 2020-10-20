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
}

export class Genetic {
    private parameters: GenParameters;
    private population: Individual[];
    private additionalParameters: Options;

    constructor(params: GenParameters, options: Options) {
        this.parameters = params;
        this.population = [];
        this.additionalParameters = options;
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
            const adn: ACOParameters = {
                alpha: this.randomMutationInRange(0.0, 3.0),
                beta: this.randomMutationInRange(0.0, 3.0),
                gamma: 0,
                Q: this.randomMutationInRange(0.01, 1.0),
                evaporationRate: this.randomMutationInRange(0.01, 1.0),
                nbAnts: 30,
                maxIterations: 200
            }
            
            const individual: Individual = {
                adn: adn,
                fitness: 0.0,
                stdFitness: 0.0,
                probability: 0.0
            }

            this.population.push(individual);
        }
    }

    public optimize(): Individual {   
        this.evaluate();     
        for (let i = 0; i < this.parameters.maxIterations; i++) {
            this.evolve();

            const pop = this.getSortedPopulation();
            for (let j = 0; j < 4; j++) {
                console.log(i + "-" + j + " / parameters: " + JSON.stringify(pop[j].adn) + ", fitness: " + pop[j].fitness + ", proba: " + pop[j].probability.toFixed(4));
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
        const mutant: Individual = {...individual};
        const immutableList = ["nbAnts", "maxIterations", "gamma"];

        for (const gene in mutant.adn) {
            if (gene in immutableList) {
                continue;
            }

            let property = gene as keyof ACOParameters;
            let rand = Math.random();
            if (rand < this.parameters.mutationRate) {
                const mutation = this.randomMutationInRange(-0.1, 0.1);
                mutant.adn[property] += mutation;
            }
        }

        return mutant;
    }

    private randomMutationInRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    private crossOver(parents: Parents): Individual {
        const child: Individual = {
            adn: {...parents.parentA.adn},
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
            if (rand < this.parameters.crossoverRate) {
                child.adn[property] = parents.parentB.adn[property];
            }
        }

        return child;
    }

    private generateNewGeneration(): Individual[] {
        const newPopulation: Individual[] = [];

        const nbChildrenToGenerate = this.parameters.populationSize - this.parameters.nbKeepBestIndividuals;
        for (let i = 0; i < nbChildrenToGenerate; i++) {
            const parents = this.selectParents();
            let child: Individual = this.crossOver(parents);
            child = this.mutate(child);
            newPopulation.push(child);
        }

        for (let i = 0; i < this.parameters.nbKeepBestIndividuals; i++) {
            newPopulation.push(this.population[i]);
        }

        return newPopulation;
    }

    private evaluate(): void {
        for (let individual of this.population) {
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
}