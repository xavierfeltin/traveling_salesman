export interface Link {
    origin: Node;
    destination: Node;
    weight: number;
    pheromones: number;
    iterationPheromones: number;
    nbTakenPath: number;
}

export interface Node {
    label: string;
    x: number;
    y: number;
    links: Link[];
}

export class Graph {
    private nodes: Node[];

    constructor() {
        this.nodes = [];
    }

    public addNode(label: string, x: number, y: number): void {
        const node: Node = {
            label: label,
            x: x,
            y: y,
            links: []
        }
        this.nodes.push(node);
    }

    public addLink(nodeA: string, nodeB: string, weight: number): void {
        let nA = this.nodes.find((n: Node) => {
            return n.label === nodeA;
        });

        let nB = this.nodes.find((n: Node) => {
            return n.label === nodeB;
        });

        if (nA && nB) {
            let linkA: Link = {
                origin: nA,
                destination: nB,
                weight: weight,
                pheromones: 0,
                iterationPheromones: 0,
                nbTakenPath: 0
            };
            nA.links.push(linkA);

            let linkB: Link = {
                origin: nB,
                destination: nA,
                weight: weight,
                pheromones: 0,
                iterationPheromones: 0,
                nbTakenPath: 0
            };
            nB.links.push(linkB);
        }
    }

    public getNode(name: string): Node | undefined {
        let node = this.nodes.find((n: Node) => {
            return n.label === name;
        });
        return node;
    }

    public getNodes(): Node[] {
        return this.nodes;
    }

    public getNodesLabel(): string[] {
        return this.nodes.map((n: Node) => {
            return n.label;
        });
    }

    public getLinks(): Link[] {
        let links: Link[] = [];
        for (let n of this.nodes) {
            for(let l of n.links) {
                links.push(l);
            }
        }
        return links;
    }

    public getLink(origin: string, destination: string): Link | undefined {
        let link;
        let nA = this.nodes.find((n: Node) => {
            return n.label === origin;
        });

        if (nA) {
            link = nA.links.find((l: Link) => {
                return l.destination.label === destination;
            });
        }

        return link;
    }

    public static loadFromJSON(json: {name: string, title: string, data: {id: string, x: number, y: number}[]}): Graph {
        let graph = new Graph();
        debugger;

        // Load nodes
        for (let point of json.data) {
            graph.addNode(point.id, point.x, point.y);
        }

        // Build links
        let nodes = [...graph.getNodes()];
        while (nodes.length > 0) {
            let current = nodes.shift();
            if (current) {
                for (let point of nodes) {
                    let weight = Math.sqrt(Math.pow((current.x - point.x), 2) + Math.pow((current.y - point.y), 2));
                    graph.addLink(current.label, point.label, weight);
                }
            }
        }

        return graph;
    }

    /*
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
    }*/

    public copy(): Graph {
        let g = new Graph();
        g.nodes = [...this.nodes];
        return g;
    }
}