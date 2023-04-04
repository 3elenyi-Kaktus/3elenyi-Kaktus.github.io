//TODO
//TODO
//TODO
//TODO
//TODO
//TODO
//TODO
//TODO
//TODO
//TODO

let _main_nodes = []
let _links = []


let _dynamic_nodes = [];
let _dynamic_links = [];


let _versions = [];


let ver_svg;
let ver_sim;
let ver_width = 1500;
let ver_height = 50;


let svg;
let simulation;
let width = 900; // = window.innerWidth;
let height = 500; // = window.innerHeight;
let linkForce;
let overall_id = 1;
let zoom;


let sec_svg;
let sec_sim;
let sec_width = 700;
let sec_height = 500;
let sec_linkForce;
let sec_zoom;


let simulation_time = 3000; // ms
let is_updating_layout = false;
let step_by_step_is_active = false;
let next_step_required = false;
let chosen_version = -1;
const linkStr = 0.1;


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
    constructor(son = null, id = null, label = null, x = 0, y = 0) {
        this.son_id = son;
        this.id = id;
        this.label = label;
        this.x = x;
        this.y = y;
    }

//Algorithmic
    son_id;
//Visual
    id; // == value
    label;
    x;
    y;
}

class ListNode {
    constructor(next_list = null, target_node = null, id = null, label = null, x = 0, y = 0) {
        this.next_list = next_list;
        this.target_node = target_node;
        this.id = id;
        this.label = label;
        this.x = x;
        this.y = y;
    }

//Algorithmic
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

//Algorithmic
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


async function Push(version_num = -1) {
    StopUpdatingLayout();

    console.log(`Push called.`);
    if (version_num === -1) {
        let x = document.getElementById('push_form');
        version_num = x.push_version.value;
        if (!isNum(version_num)) {
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
    console.log(`Parent version: ${version_num}`)

    if (step_by_step_is_active) {
        PrepareStepByStepLayout();
    }

    let x_coord = _main_nodes[parent_version.tail].x - 30 - GetRandomInt(5);
    let y_coord = _main_nodes[parent_version.tail].y - 30 - GetRandomInt(5);
    _main_nodes.push(new Node(parent_version.tail, _main_nodes.length, overall_id++, x_coord, y_coord));
    let new_node = _main_nodes.length - 1;


    _links.push(new Link(_links.length, new_node, _main_nodes[new_node].son_id));


    x_coord = _versions.at(-1).x + 32;
    y_coord = _versions.at(-1).y;
    let first_el = parent_version.head !== 0 ? parent_version.head : new_node;
    let last_el = new_node;
    let operational_list = parent_version.operational_list;
    let dynamic_list = parent_version.dynamic_list;
    let size = parent_version.size + 1;
    let operational_list_size = parent_version.operational_list_size;
    let dynamic_list_size = parent_version.dynamic_list_size;
    _versions.push(new Version(first_el, last_el, operational_list, dynamic_list, size, operational_list_size, dynamic_list_size, _versions.length, _versions.length, version_num, x_coord, y_coord));

    if (step_by_step_is_active) {
        GetNextStepText("click_on_old_version_push", version_num);
        ver_svg.select('g.nodes').select("[id='" + version_num + "']").dispatch('click')
        await WaitForNextStep();
        await UpdateMainLayout__NoPhysics();
        await UpdateVersionsLayout__NoPhysics();
        ver_svg.select('g.nodes').select("[id='" + (_versions.length - 1) + "']").dispatch('click')
        GetNextStepText("push_new_node", new_node);
        await WaitForNextStep();
    }


    await ChangeDynamicList(_versions[_versions.length - 1]);


    if (step_by_step_is_active) {
        GetNextStepText("ended_pushing");
        await WaitForNextStep();
        ReturnFromStepByStepLayout();
    }


    console.log('Push made successfully');
    await UpdateLayout();
}
async function Pop(version_num = -1) {
    StopUpdatingLayout();

    console.log(`Pop called.`);
    if (version_num === -1) {
        let x = document.getElementById('pop_form');
        version_num = x.pop_version.value;
        if (Number(version_num) >= _versions.length) {
            console.log('Invalid version number.');
            return;
        }
        version_num = Number(version_num);
    }
    console.log(`Parent version: ${version_num}.`)
    let version = _versions[version_num];
    if (version.head === 0) {
        console.log(`Can't pop from empty version`);
        return;
    }

    if (step_by_step_is_active) {
        PrepareStepByStepLayout();
    }

    let pop_value = _main_nodes[version.head].id;
    console.log(pop_value);
    let x_coord = _versions.at(-1).x + 30;
    let y_coord = _versions.at(-1).y;
    ++overall_id;

    if (step_by_step_is_active) {
        GetNextStepText("click_on_old_version_pop", version_num);
        await WaitForNextStep();

        ver_svg.select('g.nodes').select("[id='" + version_num + "']").dispatch('click')
        await WaitForNextStep();

        GetNextStepText("define_node_to_pop", pop_value);
        await WaitForNextStep();
    }

    if (version.size === 1) {
        _versions.push(new Version(0, 0, null, null, 0, 0, 0, _versions.length, _versions.length, version_num, x_coord, y_coord));

        if (step_by_step_is_active) {
            GetNextStepText("pop_node_list_size_1", version.head);
            await WaitForNextStep();

            await UpdateVersionsLayout__NoPhysics();
            ver_svg.select('g.nodes').select("[id='" + (_versions.length - 1) + "']").dispatch('click')
            await WaitForNextStep();

            GetNextStepText("ended_popping", version_num);
            await WaitForNextStep();

            ReturnFromStepByStepLayout();
        }

        console.log('Pop made successfully');
        UpdateVersionsLayout();
        return;
    }

    if (version.size === 2) {
        _versions.push(new Version(version.tail, version.tail, null, null, 1, 0, 0, _versions.length, _versions.length, version_num, x_coord, y_coord));

        if (step_by_step_is_active) {
            GetNextStepText("pop_node_list_size_2", version.head);
            await WaitForNextStep();

            await UpdateVersionsLayout__NoPhysics();
            ver_svg.select('g.nodes').select("[id='" + (_versions.length - 1) + "']").dispatch('click')
            await WaitForNextStep();

            GetNextStepText("ended_popping", version_num);
            await WaitForNextStep();

            ReturnFromStepByStepLayout();
        }

        console.log('Pop made successfully');
        UpdateVersionsLayout();
        return;
    }

    let first_el = _dynamic_nodes[version.operational_list].target_node;
    let last_el = version.tail;
    let operational_list = _dynamic_nodes[version.operational_list].next_list;
    let dynamic_list = version.dynamic_list;
    let size = version.size - 1;
    let operational_list_size = version.operational_list_size - 1;
    let dynamic_list_size = version.dynamic_list_size;
    _versions.push(new Version(first_el, last_el, operational_list, dynamic_list, size, operational_list_size, dynamic_list_size, _versions.length, _versions.length, version_num, x_coord, y_coord));

    if (step_by_step_is_active) {
        GetNextStepText("define_new_head_1", _dynamic_nodes[version.operational_list].label);
        await WaitForNextStep();

        GetNextStepText("define_new_head_2", _dynamic_nodes[operational_list].label, first_el);
        await WaitForNextStep();

        GetNextStepText("pop_node");
        await WaitForNextStep();

        await UpdateVersionsLayout__NoPhysics();
        ver_svg.select('g.nodes').select("[id='" + (_versions.length - 1) + "']").dispatch('click')
        await WaitForNextStep();

        GetNextStepText("rebuild_dynamic_list");
        await WaitForNextStep();
    }

    await ChangeDynamicList(_versions.at(-1));

    if (step_by_step_is_active) {
        GetNextStepText("ended_popping", version_num);
        await WaitForNextStep();
        ReturnFromStepByStepLayout();
    }

    console.log('Pop made successfully');
    await UpdateLayout();
}
async function ListsExchange(version) {
    if (step_by_step_is_active) {
        if (version.dynamic_list === null) {
            GetNextStepText("check_lists_swap_null")
        } else {
            GetNextStepText("check_lists_swap_", version.head, _dynamic_nodes[version.dynamic_list].label, _dynamic_nodes[version.dynamic_list].target_node, _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id);
        }
        await WaitForNextStep();
    }

    if (version.dynamic_list !== null && _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id === version.head) {
        console.log('Dynamic and operational lists swapped.');
        version.operational_list = version.dynamic_list;
        version.operational_list_size = version.dynamic_list_size;
        version.dynamic_list = null;
        version.dynamic_list_size = 0;

        if (step_by_step_is_active) {
            GetNextStepText("lists_swap_needed");
            await WaitForNextStep();
            ver_svg.select('g.nodes').select("[id='" + (_versions.length - 1) + "']").dispatch('click');
            ver_svg.select('g.nodes').select("[id='" + (_versions.length - 1) + "']").dispatch('click');
            await WaitForNextStep();
        }
        return true;
    }

    if (step_by_step_is_active) {
        GetNextStepText("lists_swap_ok");
        await WaitForNextStep();
    }
    return false;
}
async function ChangeDynamicList(version) {
    if (step_by_step_is_active) {
        GetNextStepText("check_list_size");
        await WaitForNextStep();
    }

    let curr_version_nodes_size = Math.max(0, version.size - 2);
    if (version.operational_list_size * 2 >= curr_version_nodes_size) {
        if (step_by_step_is_active) {
            GetNextStepText("list_size_ok", version.operational_list_size);
            await WaitForNextStep();
        }
        return;
    }

    if (step_by_step_is_active) {
        GetNextStepText("list_size_needs_remaster", version.operational_list_size);
        await WaitForNextStep();
    }

    if (await ListsExchange(version)) {
        if (step_by_step_is_active) {
            GetNextStepText("swap_success");
            await WaitForNextStep();
        }
        return;
    }

    if (step_by_step_is_active) {
        GetNextStepText("swap_failure");
        await WaitForNextStep();
    }

    let targeted_main_node;
    if (version.dynamic_list !== null) {
        targeted_main_node = _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id;

        if (step_by_step_is_active) {
            GetNextStepText("define_targeted_node_1", _dynamic_nodes[version.dynamic_list].label, _dynamic_nodes[version.dynamic_list].target_node, _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id);
            await WaitForNextStep();
        }
    } else {
        targeted_main_node = _main_nodes[version.tail].son_id;

        if (step_by_step_is_active) {
            GetNextStepText("define_targeted_node_2", version.tail, _main_nodes[version.tail].son_id);
            await WaitForNextStep();
        }
    }
    console.log(`New dynamic node created. Target node id: ${targeted_main_node}`);

    let next_list;
    if (version.dynamic_list !== null) {
        next_list = version.dynamic_list;
    } else {
        next_list = 0;
    }
    let x_coord = _dynamic_nodes[next_list].x - 30 - GetRandomInt(5);
    let y_coord = _dynamic_nodes[next_list].y - 30 - GetRandomInt(5);
    _dynamic_nodes.push(new ListNode(next_list, targeted_main_node, _dynamic_nodes.length, targeted_main_node, x_coord, y_coord));


    let son_id;
    if (version.dynamic_list !== null) {
        son_id = version.dynamic_list;
    } else {
        son_id = 0;
    }
    console.log('Dynamic node son_id: ' + son_id);
    _dynamic_links.push(new Link(_dynamic_links.length, _dynamic_nodes.length - 1, son_id));

    version.dynamic_list = _dynamic_nodes.length - 1;
    ++version.dynamic_list_size;

    if (step_by_step_is_active) {
        GetNextStepText("add_new_dynamic_node");
        await WaitForNextStep();

        await UpdateSecondaryLayout__NoPhysics();
        ver_svg.select('g.nodes').select("[id='" + (_versions.length - 1) + "']").dispatch('click');
        ver_svg.select('g.nodes').select("[id='" + (_versions.length - 1) + "']").dispatch('click');
        await WaitForNextStep();

        GetNextStepText("try_swap_again");
        await WaitForNextStep();
    }

    await ListsExchange(version);
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function isNum(value) {
    return /^(-?[0-9]+)$/.test(value);
}
function GetRandomInt(max_value) {
    return Math.floor(Math.random() * max_value);
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
function getTargetNodeCircumferencePoint(d) {
    let t_radius = 12; // nodeWidth is just a custom attribute I calculate during the creation of the nodes depending on the node width
    let dx = d.target.x - d.source.x;
    let dy = d.target.y - d.source.y;
    let gamma = Math.atan2(dy, dx); // Math.atan2 returns the angle in the correct quadrant as opposed to Math.atan
    let tx = d.target.x - (Math.cos(gamma) * t_radius);
    let ty = d.target.y - (Math.sin(gamma) * t_radius);
    return [tx, ty];
}
function HandleZoom(e) {
    if (!['main_svg', 'secondary_svg'].includes(e.sourceEvent.target.id.toString())) {
        return;
    }
    d3.selectAll('#' + e.sourceEvent.target.id + ' g')
        .attr('transform', e.transform);
}
async function Debug() {
    simulation_time = 1;
    await Push(0);
    await Push(1);
    await Push(2);
    await Push(3);
    await Push(4);
    await Push(5);
    await Push(5);
    await Push(5);
    await Push(5);
    await Push(6);
    await Push(1);
    await Push(7);
    await Push(12);
    await Push(11);
    simulation_time = 3000;
    await Push(14);
}

async function WaitForNextStep() {
    while (!next_step_required) {
        await sleep(10);
    }
    next_step_required = false;
}
function ToggleStepByStep() {
    if (step_by_step_is_active) {
        step_by_step_is_active = false;
        document.getElementById('step_by_step_toggle').innerText = "Activate Step";
    } else {
        step_by_step_is_active = true;
        document.getElementById('step_by_step_toggle').innerText = "Deactivate Step";
    }
}
function NextStep() {
    if (step_by_step_is_active) {
        next_step_required = true
    }
}

function PrepareStepByStepLayout() {
    document.getElementById('push_form').hidden = true;
    document.getElementById('pop_form').hidden = true;
    document.getElementById('debug').hidden = true;
    document.getElementById('step_by_step_toggle').hidden = true;
    document.getElementById('update_layout').hidden = true;
    document.getElementById('next_step').hidden = false;
}
function ReturnFromStepByStepLayout() {
    document.getElementById('push_form').hidden = false;
    document.getElementById('pop_form').hidden = false;
    document.getElementById('debug').hidden = false;
    document.getElementById('step_by_step_toggle').hidden = false;
    document.getElementById('update_layout').hidden = false;
    document.getElementById('next_step').hidden = true;
}

function SetupVersionSVG() {
    ver_svg = d3.select('#versions_svg');

    ver_svg.attr('width', ver_width)
        .attr('height', ver_height)
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
        .attr('id', function (node) {
            return node.id
        })
        .on('click', VersionClick)

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
function MakeMovableVersions() {
    let nodeElements = ver_svg.select('g.nodes').selectAll("circle")
    let textElements = ver_svg.select('g.texts').selectAll("text")

    ver_sim.nodes(_versions).on('tick', () => {
        nodeElements
            .attr('cx', function (node) {
                return node.x
            })
            .attr('cy', function (node) {
                return node.y
            })
        textElements
            .attr('x', function (node) {
                return node.x
            })
            .attr('y', function (node) {
                return node.y
            })
    })
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
function StopUpdatingVersionsLayout() {
    ver_sim.stop();
}
async function UpdateVersionsLayout__NoPhysics() {
    UpdateVersionsLayout();
    await sleep(20);
    StopUpdatingVersionsLayout();
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
        .attr('id', function (node) {
            return node.id
        })
        .attr('dx', 10)
        .attr('dy', -7)

    zoom = d3.zoom()
        .scaleExtent([0.2, 5])
        // .translateExtent([[0, 0], [width, height]])
        .on('zoom', HandleZoom);
    d3.select('#main_svg')
        .call(zoom);

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
function MakeMovableMain() {
    let linkElements = svg.select('g.links').selectAll("line")
    let nodeElements = svg.select('g.nodes').selectAll("circle")
    let textElements = svg.select('g.texts').selectAll("text")

    simulation.nodes(_main_nodes).on('tick', () => {
        nodeElements
            .attr('cx', function (node) {
                return node.x
            })
            .attr('cy', function (node) {
                return node.y
            })
        textElements
            .attr('x', function (node) {
                return node.x
            })
            .attr('y', function (node) {
                return node.y
            })
        linkElements
            .attr('x1', function (link) {
                return link.source.x
            })
            .attr('y1', function (link) {
                return link.source.y
            })
            .attr("x2", function (d) {
                return getTargetNodeCircumferencePoint(d)[0];
            })
            .attr("y2", function (d) {
                return getTargetNodeCircumferencePoint(d)[1];
            })
        // .attr('x2', function (link) {return link.target.x})
        // .attr('y2', function (link) {return link.target.y})
    })
}
function UpdateMainLayout() {
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
        .attr('id', function (node) {
            return node.id
        })
        .attr("dx", 7)
        .attr("dy", -10)

    MakeMovableMain();

    simulation
        .alpha(0.5)
        .alphaTarget(0.3)
        .restart();
}
function StopUpdatingMainLayout() {
    simulation.stop();
}
async function UpdateMainLayout__NoPhysics() {
    UpdateMainLayout();
    await sleep(20);
    StopUpdatingMainLayout();
}

function SetupSecondarySVG() {
    sec_svg = d3.select('#secondary_svg');

    sec_svg.attr('width', sec_width)
        .attr('height', sec_height)
        .style('position', 'absolute')
        .style('margin-left', '5px')
        .style('background', 'aquamarine')

    sec_linkForce = d3
        .forceLink()
        .id(function (link) {
            return link.id
        })
        .strength(function (link) {
            return link.strength
        })

    sec_sim = d3
        .forceSimulation()
        .force('link', sec_linkForce)
        .force('charge', d3.forceManyBody().strength(-50))
        .force('center', d3.forceCenter(sec_width / 2, sec_height / 2))

    sec_svg.append('g')
        .attr('class', 'links')

    sec_svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(_dynamic_nodes)
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'regular_node')
        .attr('id', function (node) {
            return node.id
        })

    sec_svg.append('g')
        .attr('class', 'texts')
        .selectAll('text')
        .data(_dynamic_nodes)
        .enter().append('text')
        .text(function (node) {
            return node.label
        })
        .attr('class', 'graph_text')
        .attr('id', function (node) {
            return node.id
        })
        .attr('dx', 10)
        .attr('dy', -7)

    sec_zoom = d3.zoom()
        .scaleExtent([0.2, 5])
        // .translateExtent([[0, 0], [width, height]])
        .on('zoom', HandleZoom);
    d3.select('#secondary_svg')
        .call(sec_zoom);

    const markerBoxWidth = 8;
    const markerBoxHeight = 5;
    const refX = markerBoxWidth / 2;
    const refY = markerBoxHeight / 2;
    const markerWidth = markerBoxWidth / 2;
    const markerHeight = markerBoxHeight / 2;
    const arrowPoints = [[0, 0], [0, 8], [5, 4]];

    sec_svg
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

    MakeMovableSecondary();

    sec_sim.force('link').links(_dynamic_links)
}
function MakeMovableSecondary() {
    let linkElements = sec_svg.select('g.links').selectAll("line")
    let nodeElements = sec_svg.select('g.nodes').selectAll("circle")
    let textElements = sec_svg.select('g.texts').selectAll("text")

    sec_sim.nodes(_dynamic_nodes).on('tick', () => {
        nodeElements
            .attr('cx', function (node) {
                return node.x
            })
            .attr('cy', function (node) {
                return node.y
            })
        textElements
            .attr('x', function (node) {
                return node.x
            })
            .attr('y', function (node) {
                return node.y
            })
        linkElements
            .attr('x1', function (link) {
                return link.source.x
            })
            .attr('y1', function (link) {
                return link.source.y
            })
            .attr("x2", function (d) {
                return getTargetNodeCircumferencePoint(d)[0];
            })
            .attr("y2", function (d) {
                return getTargetNodeCircumferencePoint(d)[1];
            })
        // .attr('x2', function (link) {return link.target.x})
        // .attr('y2', function (link) {return link.target.y})
    })
}
function UpdateSecondaryLayout() {
    sec_svg.select('g.links')
        .selectAll('line')
        .data(_dynamic_links)
        .enter().append('line')
        .attr('class', 'arrow_link')
        .attr('id', function (link) {
            return link.id
        })

    sec_svg.select('g.nodes')
        .selectAll('circle')
        .data(_dynamic_nodes)
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'regular_node')
        .attr('id', function (node) {
            return node.id
        })

    sec_svg.select('g.texts')
        .selectAll('text')
        .data(_dynamic_nodes)
        .enter().append('text')
        .text(function (node) {
            return node.label
        })
        .attr('class', 'graph_text')
        .attr('id', function (node) {
            return node.id
        })
        .attr("dx", 7)
        .attr("dy", -10)

    MakeMovableSecondary();

    sec_sim
        .alpha(0.5)
        .alphaTarget(0.3)
        .restart();
}
function StopUpdatingSecondaryLayout() {
    sec_sim.stop();
}
async function UpdateSecondaryLayout__NoPhysics() {
    UpdateSecondaryLayout();
    await sleep(20);
    StopUpdatingSecondaryLayout();
}

function Setup() {
    _versions.push(new Version(0, 0, null, null, 0, 0, 0, 0, 'N', null, 25, 25));
    _main_nodes.push(new Node(null, 0, 'Null', 40, 40));
    _dynamic_nodes.push(new ListNode(null, null, 0, 'Null', 40, 40));

    SetupVersionSVG();
    SetupMainSVG();
    SetupSecondarySVG();
}
async function UpdateLayout() {
    is_updating_layout = true;
    console.log(`Started updating version layout`);
    UpdateVersionsLayout();
    UpdateMainLayout();
    UpdateSecondaryLayout();
    await sleep(simulation_time);
    StopUpdatingLayout();
    console.log(`Ended reshaping layout`);
}
function StopUpdatingLayout() {
    if (is_updating_layout) {
        simulation.stop();
        sec_sim.stop();
        ver_sim.stop();
        is_updating_layout = false;
    }
}


function VersionClick(click) {
    console.log(`Version ${click.target.id} was clicked.`);
    let version = _versions[click.target.id];


    if (chosen_version === version.id) { // Version is same, return graph to default
        svg.select('g.nodes')
            .selectAll('circle')
            .attr('class', 'regular_node');
        svg.select('g.links')
            .selectAll('line')
            .attr('class', 'arrow_link');
        svg.select('g.texts')
            .selectAll('text')
            .attr('class', 'graph_text');

        sec_svg.select('g.nodes')
            .selectAll('circle')
            .attr('class', 'regular_node');
        sec_svg.select('g.links')
            .selectAll('line')
            .attr('class', 'arrow_link');
        sec_svg.select('g.texts')
            .selectAll('text')
            .attr('class', 'graph_text');

        chosen_version = -1;
        console.log(`Parameters were reassigned.`);
        return;
    }


    chosen_version = version.id;    // New version clicked, make all graph faint
    svg.select('g.links')
        .selectAll('line')
        .attr('class', 'faint_arrow_link');
    svg.select('g.nodes')
        .selectAll('circle')
        .attr('class', 'faint_node');
    svg.select('g.texts')
        .selectAll('text')
        .attr('class', 'faint_text');

    sec_svg.select('g.links')
        .selectAll('line')
        .attr('class', 'faint_arrow_link');
    sec_svg.select('g.nodes')
        .selectAll('circle')
        .attr('class', 'faint_node');
    sec_svg.select('g.texts')
        .selectAll('text')
        .attr('class', 'faint_text');

    if (version.tail === 0) {
        svg.select('g.nodes')   // Null version, show null node only
            .select("[id='0']")
            .attr('class', 'null_node');
        svg.select('g.texts')
            .select("[id='0']")
            .attr('class', 'graph_text');
        return;
    }

    let curr_node = svg.select('g.nodes')   // Draw the body with black nodes
        .select("[id='" + version.tail + "']");
    let curr_link = svg.select('g.links')
        .select("[id='" + (version.tail - 1) + "']");
    let curr_text = svg.select('g.texts')
        .select("[id='" + version.tail + "']");
    while (Number(curr_node.attr('id')) >= version.head) {
        curr_node.attr('class', 'mid_node');
        if (Number(curr_node.attr('id')) > version.head) {
            curr_link.attr('class', 'arrow_link');
        }
        curr_text.attr('class', 'graph_text');
        curr_link = svg.select('g.links')
            .select("[id='" + (_main_nodes[Number(curr_node.attr('id'))].son_id - 1) + "']");
        curr_node = svg.select('g.nodes')
            .select("[id='" + _main_nodes[Number(curr_node.attr('id'))].son_id + "']");
        curr_text = svg.select('g.texts')
            .select("[id='" + curr_node.attr('id') + "']");
    }

    if (version.operational_list !== null) {
        curr_node = sec_svg.select('g.nodes')   // Draw the operational list with aqua nodes
            .select("[id='" + version.operational_list + "']");
        curr_link = sec_svg.select('g.links')
            .select("[id='" + (version.operational_list - 1) + "']");
        curr_text = sec_svg.select('g.texts')
            .select("[id='" + version.operational_list + "']");
        while (Number(curr_node.attr('id')) > 0) {
            curr_node.attr('class', 'operational_node');
            if (_dynamic_links[curr_link.attr('id')].target.id !== 0) {
                curr_link.attr('class', 'arrow_link');
            }
            curr_text.attr('class', 'graph_text');
            curr_link = sec_svg.select('g.links')
                .select("[id='" + (_dynamic_nodes[Number(curr_node.attr('id'))].next_list - 1) + "']");
            curr_node = sec_svg.select('g.nodes')
                .select("[id='" + _dynamic_nodes[Number(curr_node.attr('id'))].next_list + "']");
            curr_text = sec_svg.select('g.texts')
                .select("[id='" + curr_node.attr('id') + "']");
        }
    }


    if (version.dynamic_list !== null) {
        curr_node = sec_svg.select('g.nodes')   // Draw the dynamic list with yellow nodes
            .select("[id='" + version.dynamic_list + "']");
        curr_link = sec_svg.select('g.links')
            .select("[id='" + (version.dynamic_list - 1) + "']");
        curr_text = sec_svg.select('g.texts')
            .select("[id='" + version.dynamic_list + "']");
        while (Number(curr_node.attr('id')) > 0) {
            curr_node.attr('class', 'dynamic_node');
            if (_dynamic_links[curr_link.attr('id')].target.id !== 0) {
                curr_link.attr('class', 'arrow_link');
            }
            curr_text.attr('class', 'graph_text');
            curr_link = sec_svg.select('g.links')
                .select("[id='" + (_dynamic_nodes[Number(curr_node.attr('id'))].next_list - 1) + "']");
            curr_node = sec_svg.select('g.nodes')
                .select("[id='" + _dynamic_nodes[Number(curr_node.attr('id'))].next_list + "']");
            curr_text = sec_svg.select('g.texts')
                .select("[id='" + curr_node.attr('id') + "']");
        }
    }

    if (version.operational_list === null || version.dynamic_list === null) {
        sec_svg.select('g.nodes')   // Null version, show null node only
            .select("[id='0']")
            .attr('class', 'null_node');
        sec_svg.select('g.texts')
            .select("[id='0']")
            .attr('class', 'graph_text');
    }


    svg.select('g.nodes')       // Draw head and tail nodes
        .select("[id='" + version.head + "']")
        .attr('class', 'head_node');
    svg.select('g.nodes')
        .select("[id='" + version.tail + "']")
        .attr('class', 'tail_node');


    console.log(`Parameters were reassigned.`);
}

function GetNextStepText() {
    let option = arguments[0];
    let text = document.getElementById('help_text');
    switch (option) {
        case "click_on_old_version_push":
            text.innerHTML =
                `We want to push new node to version ${arguments[1]}.`;
            break
        case "push_new_node":
            text.innerHTML =
                `We simply copy new version from the chosen one and link our new node ${arguments[1]} to the tail of this version in main tree.\n
                Now new version tail has changed.`;
            break

        case "check_list_size":
            text.innerHTML =
                `We compare new number of untracked nodes (black nodes in queue body) with corresponding operational list size (blue nodes)\n.`;
            break
        case "list_size_ok":
            text.innerHTML =
                `Operational list size is ${arguments[1]}, which is more or equal to 1/2 of the number of untracked nodes.\n
                Nothing needs to be changed.`;
            break
        case "list_size_needs_remaster":
            text.innerHTML =
                `Operational list size is ${arguments[1]}, which is less than 1/2 of the number of untracked nodes.\n
                We check if it's possible to swap operational and dynamic lists (in case, previous pop gave us possibility to do so).`;
            break
        case "swap_success":
            text.innerHTML =
                `We successfully swapped lists, now dynamic list is empty.\n
                Nothing else needs to be done.\n`;
            break
        case "swap_failure":
            text.innerHTML =
                `We couldn't swap lists, so we need to create new additional dynamic list node.\n`;
            break

        case "check_lists_swap_null":
            text.innerHTML =
                `We check if dynamic list reached corresponding version head.\n
                In our case, dynamic list is a NULL.\n`;
            break
        case "check_lists_swap_":
            text.innerHTML =
                `We check if dynamic list reached corresponding version head.\n
                In our case, version head is node ${arguments[1]}.\n
                We perform following operations:
                1) Get dynamic list node - it's node ${arguments[2]}.\n
                2) Get it's targeted node in main tree - it's node ${arguments[3]}.\n
                3) Get targeted node son - it's node ${arguments[4]}`;
            break
        case "lists_swap_ok":
            text.innerHTML =
                `Dynamic list didn't reach list head, nothing changes.`;
            break
        case "lists_swap_needed":
            text.innerHTML =
                `We got the same nodes, that means dynamic list reached list head.\n
                 So we treat dynamic list as operational (e.g. swap them).`;
            break

        case "define_targeted_node_1":
            text.innerHTML =
                `To do so, we need to define targeted node in main tree and son in dynamic tree.\n
                As for the targeted node in main tree, we make following operations:\n
                1) Get current dynamic list node - it's node ${arguments[1]}.
                2) Get from it targeted node in main tree - it's node ${arguments[2]}.
                3) Get from targeted node it's son - node ${arguments[3]}.
                So, now we know the first node for creating new dynamic node.
                The second node could be simply found, because current dynamic list node (node ${arguments[1]}) will do.\n`;
            break
        case "define_targeted_node_2":
            text.innerHTML =
                `To do so, we need to define targeted node in main tree and son in dynamic tree.\n
                As for the targeted node in main tree, we just need to get son of the tail node:\n
                1) Current tail is node ${arguments[1]}.
                2) We get it's son - node ${arguments[2]}.
                So, now we know the first node for creating new dynamic node.
                Because we didn't have a dynamic list for previous version, new dynamic node son points to NULL.\n`;
            break
        case "add_new_dynamic_node":
            text.innerHTML =
                `This way, we created new dynamic node, as a parent for previous one.\n
                Let's add it to the tree.\n`;
            break
        case "try_swap_again":
            text.innerHTML =
                `We need to try swapping operational and dynamic lists again.\n`;
            break

        case "ended_pushing":
            text.innerHTML = `We ended pushing to our chosen version!`;
            break



        case "click_on_old_version_pop":
            text.innerHTML =
                `We want to pop node from version ${arguments[1]}.\n
                Let's select this version.\n`;
            break

        case "define_node_to_pop":
            text.innerHTML =
                `Our head points at node ${arguments[1]}, so we want to pop it.\n`;
            break
        case "pop_node_list_size_1":
            text.innerHTML =
                `We have only 1 node in our queue, so we can simply reset our pointers to head and tail to NULL.\n
                Basically, our new version equals to starting N version.\n`;
            break
        case "pop_node_list_size_2":
            text.innerHTML =
                `We have only 2 nodes in our queue, so we can simply change our head-pointer to tail-pointer.\n`;
            break
        case "define_new_head_1":
            text.innerHTML =
                `We want to define, which node will be next head.\n
                 Since we have more than 2 nodes in queue, we can't do it straightforwardly.\n
                 So we will refer to our operational list.\n
                 This version operational pointer refers to node ${arguments[1]} in operational list.\n`;
            break
        case "define_new_head_2":
            text.innerHTML =
                `In return, this operational node has two important parameters:\n
                1) next operational node (it's son) - node ${arguments[1]},\n
                2) targeted main queue node - node ${arguments[2]} in main tree.\n`;
            break
        case "pop_node":
            text.innerHTML =
                `So now we know, how to create new version. We simply copy new version from the chosen one.\n
                 Then, we change head-pointer and operational list pointer to nodes, at which current operational list node points to accordingly.\n`;
            break
        case "rebuild_dynamic_list":
            text.innerHTML =
                `The only thing, that still needs changes is our dynamic list.\n
                Let's rebuild it, if it needs changes.\n`;
            break

        case "ended_popping":
            text.innerHTML = `We ended popping from our chosen version!`;
            break
    }
}









