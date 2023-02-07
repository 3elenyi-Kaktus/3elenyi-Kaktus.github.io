//TODO
//TODO
//TODO
//TODO
//TODO
//TODO Если вызывается отрисовка пустой версии, то не должно ничего произойти
//TODO Если вызвать Push на пустую версию, то она должна начинать отрисовываться из корня
//TODO Если вызвать Pop на пустую версию, то ничего не должно произойти
//TODO
//TODO
//TODO
//TODO
//TODO
//TODO

let _main_nodes = [
]
let _dynamic_nodes = [
];


let _versions = [
];
let _links = [
    {id: 0, source: 0, target: 0, strength: 0.1}
]



let ver_svg;
let ver_sim;


let svg;
let width = window.innerWidth;
let height = window.innerHeight;
width = 1200;
height = 700;
let linkForce;
let simulation;
let Zoom;
const linkStr = 0.1;


let overall_id = 1;
let is_processing = false;
let chosen_version = -1;



class Link {
    constructor(id = null, source = null, target = null, strength = linkStr) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.strength = strength;
    }
    id;
    source;
    target;
    strength;
}

class Node {
    constructor(son = null, value = null, id = null, label = null, x = 0, y = 0) {
        this.son_id = son;
        this.value = value;
        this.id = id;
        this.label = label;
        this.x = x;
        this.y = y;
    }
//Algorythmic
    son_id;
    value;
//Visual
    id;
    label;
    x;
    y;
}
class ListNode {
    constructor(next_list, target_node) {
        this.next_list = next_list;
        this.target_node = target_node;
    }
//Algorythmic
    next_list;
    target_node;
//Visual
    id;
    label;
    x;
    y;
}
class Version {
    constructor(head, tail, operational_list, dynamic_list, size, operational_list_size, dynamic_list_size,
                id = null, label = null, parent = null, x = 0, y = 0) {
        this.head = head;
        this.tail = tail;
        this.operational_list = operational_list;
        this.dynamic_list = dynamic_list;
        this.size = size;
        this.operational_list_size = operational_list_size;
        this.dynamic_list_size = dynamic_list_size;
        this.id = id;
        this.label = label;
        this.parent = parent;
        this.x = x;
        this.y = y;
    }
//Algorythmic
    head;
    tail;
    operational_list;
    dynamic_list;
    size;
    operational_list_size;
    dynamic_list_size;
//Visual
    id;
    label;
    parent;
    x;
    y;
}

async function Push(version_num = -1, value = -1) {
    console.log('Push called');
    if (version_num === -1) {
        let x = document.getElementById('push_form');
        value = x.push_value.value;
        version_num = x.push_version.value;
        if (!isNum(value) || !isNum(version_num)) {
            console.log('Invalid input format.');
            return;
        }
        if (Number(version_num) >= _versions.length) {
            console.log('Invalid version number.');
            return;
        }
        version_num = Number(version_num);
    }
    let parent_version = _versions[version_num];


    let x_coord = _main_nodes[parent_version.tail].x - 30;
    let y_coord = _main_nodes[parent_version.tail].y - 30;
    _main_nodes.push(new Node(parent_version.tail, value, _main_nodes.length, overall_id++, x_coord, y_coord));
    let new_node = _main_nodes.length - 1;


    _links.push(new Link(_links.length, new_node, _main_nodes[new_node].son_id));


    x_coord = _versions.at(-1).x + 30;
    y_coord = _versions.at(-1).y;
    let first_el = parent_version.head !== null ? parent_version.head : new_node;
    let last_el = new_node;
    let operational_list = parent_version.operational_list;
    let dynamic_list = parent_version.dynamic_list;
    let size = parent_version.size + 1;
    let operational_list_size = parent_version.operational_list_size;
    let dynamic_list_size = parent_version.dynamic_list_size;
    _versions.push(new Version(first_el, last_el, operational_list, dynamic_list, size, operational_list_size, dynamic_list_size, _versions.length, _versions.length, version_num, x_coord, y_coord));
    ChangeDynamicList(_versions[_versions.length - 1]);


    console.log('Push made successfully');
    UpdateVersionsLayout();
    await UpdateLayout();
}
function Pop(version_num = -1) {
    console.log('Pop called');
    if (version_num === -1) {
        let x = document.getElementById('pop_form');
        version_num = x.pop_version.value;
        if (Number(version_num) >= _versions.length) {
            console.log('Invalid version number.');
            return;
        }
        version_num = Number(version_num);
    }

    let version = _versions[version_num];
    let pop_value = _main_nodes[version.head].value;
    console.log(pop_value);
    let x_coord, y_coord;
    if (version.size === 1) {
        x_coord = _versions.at(-1).x + 30;
        y_coord = _versions.at(-1).y;
        _versions.push(new Version(null, null, null, null, 0, 0, 0, _versions.length, _versions.length, version_num, x_coord, y_coord));
        console.log('Pop made successfully');
        UpdateVersionsLayout();
        return;
    }
    if (version.size === 2) {
        x_coord = _versions.at(-1).x + 30;
        y_coord = _versions.at(-1).y;
        _versions.push(new Version(version.tail, version.tail, null, null, 1, 0, 0, _versions.length, _versions.length, version_num, x_coord, y_coord));
        console.log('Pop made successfully');
        UpdateVersionsLayout();
        return;
    }
    x_coord = _versions.at(-1).x + 30;
    y_coord = _versions.at(-1).y;
    let first_el = _dynamic_nodes[version.operational_list].target_node;
    let last_el = version.tail;
    let operational_list = _dynamic_nodes[version.operational_list].next_list;
    let dynamic_list = version.dynamic_list;
    let size = version.size - 1;
    let operational_list_size = version.operational_list_size - 1;
    let dynamic_list_size = version.dynamic_list_size;
    _versions.push(new Version(first_el, last_el, operational_list, dynamic_list, size, operational_list_size, dynamic_list_size, _versions.length, _versions.length, version_num, x_coord, y_coord));
    ChangeDynamicList(_versions[_versions.length - 1]);

    console.log('Pop made successfully');
    UpdateVersionsLayout();

}
function ListsExchange(version) {
    if (version.dynamic_list !== null && _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id === version.head) {
        console.log('Dynamic and operational lists swapped.');
        version.operational_list = version.dynamic_list;
        version.operational_list_size = version.dynamic_list_size;
        version.dynamic_list = null;
        version.dynamic_list_size = 0;
        return true;
    }
    return false;
}
function ChangeDynamicList(version) {
    let curr_version_nodes_size = Math.max(0, version.size - 2);
    if (version.operational_list_size * 2 < curr_version_nodes_size && !ListsExchange(version)) {
        let new_dynamic_node;
        if (version.dynamic_list !== null) {
            new_dynamic_node = _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id;
        } else {
            new_dynamic_node = _main_nodes[version.tail].son_id;
        }
        console.log('New dynamic node created. Target node id: ' + new_dynamic_node);
        _dynamic_nodes.push(new ListNode(version.dynamic_list, new_dynamic_node));
        version.dynamic_list = _dynamic_nodes.length - 1;
        ++version.dynamic_list_size;
        ListsExchange(version);
    }
}






function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function isNum(value) {
    return /^(-?[0-9]+)$/.test(value);
}
/*function ToStack() {
    document.getElementById("main_page").hidden = true;
    StartStack();
    document.getElementById("node_0").classList.add("animate");
    document.getElementById("stack_page").hidden = false;
}*/
/*function ToMain() {
    document.getElementById("main_page").hidden = false;
    document.getElementById("stack_page").hidden = true;
}*/
function Debug() {

}



function UpdateVersionsLayout() {
    ver_svg.select('g.links')
        .selectAll('line')
        .data(_links)
        .enter().append('line')
        .attr('class', 'arrow_link')
        .attr('id', function (link) {
            return link.id
        })

    ver_svg.select('g.nodes')
        .selectAll('circle')
        .data(_versions)
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'version_node')
        .attr('id', function (node) {
            return node.id
        })
        .on('click', VersionClick)

    ver_svg.select('g.texts')
        .selectAll('text')
        .data(_versions)
        .enter().append('text')
        .text(function (node) {
            return node.label
        })
        .attr('class', 'version_text')
        .attr('dx', 7)
        .attr('dy', 20)



    MakeMovableVersions();


    ver_sim
        .restart();
}
async function UpdateLayout() {
    svg.select('g.links')
        .selectAll('line')
        .data(_links)
        .enter().append('line')
        .attr('class', 'arrow_link')
        .attr('id', function (link) {
            return link.id
        })

    svg.select('g.nodes')
        .selectAll('circle')
        .data(_main_nodes)
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'regular_node')
        .attr('id', function (node) {
            return node.id
        })

    svg.select('g.texts')
        .selectAll('text')
        .data(_main_nodes)
        .enter().append('text')
        .text(function (node) {
            return node.label
        })
        .attr('class', 'graph_text')
        .attr("dx", 7)
        .attr("dy", -10)

    MakeMovableMain();

    simulation
        .alpha(0.5)
        .alphaTarget(0.3)
        .restart();

    if (!is_processing) {
        is_processing = true;
        await sleep(7000);
        simulation.stop();
        is_processing = false;
    }
}
function MakeMovableMain() {
    let linkElements = svg.select('g.links').selectAll("line")
    let nodeElements = svg.select('g.nodes').selectAll("circle")
    let textElements = svg.select('g.texts').selectAll("text")

    simulation.nodes(_main_nodes).on('tick', () => {
        nodeElements
            .attr('cx', function (node) {return node.x})
            .attr('cy', function (node) {return node.y})
        textElements
            .attr('x', function (node) {return node.x})
            .attr('y', function (node) {return node.y})
        linkElements
            .attr('x1', function (link) {return link.source.x})
            .attr('y1', function (link) {return link.source.y})
            .attr("x2", function(d) {
                return getTargetNodeCircumferencePoint(d)[0];
            })
            .attr("y2", function(d) {
                return getTargetNodeCircumferencePoint(d)[1];
            })
        // .attr('x2', function (link) {return link.target.x})
        // .attr('y2', function (link) {return link.target.y})
    })
}
function getTargetNodeCircumferencePoint(d){
    let t_radius = 12; // nodeWidth is just a custom attribute I calculate during the creation of the nodes depending on the node width
    let dx = d.target.x - d.source.x;
    let dy = d.target.y - d.source.y;
    let gamma = Math.atan2(dy,dx); // Math.atan2 returns the angle in the correct quadrant as opposed to Math.atan
    let tx = d.target.x - (Math.cos(gamma) * t_radius);
    let ty = d.target.y - (Math.sin(gamma) * t_radius);
    return [tx,ty];
}
function MakeMovableVersions() {
    let linkElements = ver_svg.select('g.links').selectAll("line")
    let nodeElements = ver_svg.select('g.nodes').selectAll("circle")
    let textElements = ver_svg.select('g.texts').selectAll("text")

    ver_sim.nodes(_versions).on('tick', () => {
        nodeElements
            .attr('cx', function (node) {return node.x})
            .attr('cy', function (node) {return node.y})
        textElements
            .attr('x', function (node) {return node.x})
            .attr('y', function (node) {return node.y})
        linkElements
            .attr('x1', function (link) {return link.source.x})
            .attr('y1', function (link) {return link.source.y})
            .attr('x2', function (link) {return link.target.x})
            .attr('y2', function (link) {return link.target.y})
    })
}



function SetupVersionSVG() {
    ver_svg = d3.select('#versions_svg');

    ver_svg.attr('width', 1200)
        .attr('height', 50)
        .style('background', 'black')

    ver_svg.append('g')
        .attr('class', 'links')

    ver_svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(_versions)
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'version_node')

    ver_svg.append('g')
        .attr('class', 'texts')
        .selectAll('text')
        .data(_versions)
        .enter().append('text')
        .text(function (node) {
            return node.label
        })
        .attr('class', 'version_text')
        .attr('dx', 7)
        .attr('dy', 20)

    ver_sim = d3
        .forceSimulation()

    const markerBoxWidth = 10;
    const markerBoxHeight = 10;
    const refX = markerBoxWidth / 2;
    const refY = markerBoxHeight / 2;
    const markerWidth = markerBoxWidth / 2;
    const markerHeight = markerBoxHeight / 2;
    const arrowPoints = [[0, 0], [0, 8], [5, 4]];

    ver_svg
        .append('defs')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
        .attr('refX', refX)
        .attr('refY', refY)
        .attr('markerWidth', markerWidth)
        .attr('markerHeight', markerHeight)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', d3.line()(arrowPoints))
        .attr('stroke', 'black');

    MakeMovableVersions();
}
function SetupMainSVG() {
    svg = d3.select('#main_svg');

    svg.attr('width', width)
        .attr('height', height)
        .style('background', 'cyan')

    linkForce = d3
        .forceLink()
        .id(function (link) {
            return link.id
        })
        .strength(function (link) {
            return link.strength
        })

    simulation = d3
        .forceSimulation()
        .force('link', linkForce)
        .force('charge', d3.forceManyBody().strength(-50))
        .force('center', d3.forceCenter(width / 2, height / 2))

    svg.append('g')
        .attr('class', 'links')

    svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(_main_nodes)
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'regular_node')
        .attr('id', function (node) {
            return node.id
        })

    svg.append('g')
        .attr('class', 'texts')
        .selectAll('text')
        .data(_main_nodes)
        .enter().append('text')
        .text(function (node) {
            return node.label
        })
        .attr('class', 'graph_text')
        .attr('dx', 10)
        .attr('dy', -7)

    const markerBoxWidth = 8;
    const markerBoxHeight = 5;
    const refX = markerBoxWidth / 2;
    const refY = markerBoxHeight / 2;
    const markerWidth = markerBoxWidth / 2;
    const markerHeight = markerBoxHeight / 2;
    const arrowPoints = [[0, 0], [0, 8], [5, 4]];

    svg
        .append('defs')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
        .attr('refX', refX)
        .attr('refY', refY)
        .attr('markerWidth', markerWidth)
        .attr('markerHeight', markerHeight)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', d3.line()(arrowPoints))
        .attr('stroke', 'black');

    MakeMovableMain();

    simulation.force('link').links(_links)
}
function Setup() {
    _versions.push(new Version(0, 0, null, null, 1, 0, 0, 0, 'Sv', null, 25, 25));
    _main_nodes.push(new Node(null, null, 0, 'Sn', 0, 0));

    SetupVersionSVG();
    SetupMainSVG();

    // Push(0, 1).then();
    // Push(1, 2).then();
    // Push(2, 3).then();
    // Push(2, 4).then();
}




async function VersionClick() {
    let version = _versions[this.id];
    if (chosen_version !== -1) {
        svg.select('g.nodes')
            .select("[id='" + _versions[chosen_version].head + "']")
            .attr('class', 'regular_node');
        svg.select('g.nodes')
            .select("[id='" + _versions[chosen_version].tail + "']")
            .attr('class', 'regular_node');
    }

    if (chosen_version === Number(version.id)) {
        svg.select('g.nodes')
            .selectAll('circle')
            .attr('class', 'regular_node');
        svg.select('g.links')
            .selectAll('line')
            .attr('class', 'arrow_link');
        chosen_version = -1;
        return;
    }
    chosen_version = Number(version.id);


    svg.select('g.links')
        .selectAll('line')
        .attr('class', 'faint_arrow_link');
    svg.select('g.nodes')
        .selectAll('circle')
        .attr('class', 'faint_node');


    let curr_link = svg.select('g.links')
        .select("[id='" + version.tail + "']");
    let curr_node = svg.select('g.nodes')
        .select("[id='" + version.tail + "']");
    while (curr_link.attr('id') !== version.head.toString()) {
        curr_node.attr('class', 'mid_node');
        curr_link.attr('class', 'arrow_link');
        curr_node = svg.select('g.nodes')
            .select("[id='" + _links[Number(curr_link.attr('id'))].target.id + "']");
        curr_link = svg.select('g.links')
            .select("[id='" + _links[Number(curr_link.attr('id'))].target.id + "']");
    }


    svg.select('g.nodes')
        .select("[id='" + version.head + "']")
        .attr('class', 'head_node');
    svg.select('g.nodes')
        .select("[id='" + version.tail + "']")
        .attr('class', 'tail_node');

    await UpdateLayout();  //TODO необязательная штука, перестраивает все поле снова
}












