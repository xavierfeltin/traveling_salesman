export interface Link {
    origin: string;
    destination: string;
    weight: number;
    pheromones: number;
    iterationPheromones: number;
    nbTakenPath: number;
}

export class Graph {
    private nodes: any;

    constructor() {
        this.nodes = {};
    }

    public addNode(label: string): void {
        this.nodes[label] = {
            links: {}
        }
    }

    public addLink(nodeA: string, nodeB: string, weight: number): void {
        this.nodes[nodeA].links[nodeB] = {
            origin: nodeA,
            destination: nodeB,
            weight: weight
        };

        this.nodes[nodeB].links[nodeA] = {
            origin: nodeB,
            destination: nodeA,
            weight: weight
        };
    }

    public getNode(name: string): any | undefined {
        return this.nodes[name] ? this.nodes[name] : undefined;
    }

    public getNodes(): string[] {
        let keys = Object.keys(this.nodes);
        return keys;
    }

    public getLinks(): Link[] {
        let links: Link[] = [];
        let keys = Object.keys(this.nodes);
        for (let key of keys) {
            let currentNodeLinks = this.nodes[key].links
            for(let l of Object.keys(currentNodeLinks)) {
                links.push(currentNodeLinks[l]);
            }            
        }
        return links;
    }

    public getLink(origin: string, destination: string): Link {
        return this.nodes[origin].links[destination];
    }

    public static generate(): Graph {
        let graph = new Graph();

        graph.addNode("Lyon");
        graph.addNode("Villefranche");
        graph.addNode("Saint-Etienne");
        graph.addNode("Bourgoin-Jallieu");
        graph.addNode("Mâcon");
        graph.addNode("Valence");

        graph.addLink("Lyon", "Villefranche", 36);
        graph.addLink("Lyon", "Saint-Etienne", 63);
        graph.addLink("Lyon", "Bourgoin-Jallieu", 52);
        graph.addLink("Lyon", "Mâcon", 72);
        graph.addLink("Lyon", "Valence", 102);

        graph.addLink("Villefranche", "Saint-Etienne", 92);
        graph.addLink("Villefranche", "Bourgoin-Jallieu", 85);
        graph.addLink("Villefranche", "Mâcon", 40);
        graph.addLink("Villefranche", "Valence", 132);

        graph.addLink("Saint-Etienne", "Bourgoin-Jallieu", 91);
        graph.addLink("Saint-Etienne", "Mâcon", 131);
        graph.addLink("Saint-Etienne", "Valence", 93);

        graph.addLink("Bourgoin-Jallieu", "Mâcon", 121);
        graph.addLink("Bourgoin-Jallieu", "Valence", 120);

        graph.addLink("Mâcon", "Valence", 170);

        return graph;
    }

    public copy(): Graph {
        let g = new Graph();
        g.nodes = {...this.nodes};
        return g;
    }
}