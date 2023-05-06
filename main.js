//TODO
// Поправить сохранение каждого состояния, кажется сейчас это не так эффективно
// Возможен визуальный (а может и технический, хз) баг при постоянных возвратах/переходах вперед при пошаговой раскладке,
// добавленные ноды не крепятся к своим линкам. Не уверен, что починил его.
//


let _main_nodes = []
let _links = []
let _dynamic_nodes = [];
let _dynamic_links = [];
let _versions = [];


let ver_svg;
let ver_sim;
let ver_width = 1800;
let ver_height = 50;


let main_svg;
let main_sim;
let main_width = 900; // = window.innerWidth;
let main_height = 500; // = window.innerHeight;
let linkForce;
let overall_id = 1;
let main_zoom;


let sec_svg;
let sec_sim;
let sec_width = 700;
let sec_height = 500;
let sec_linkForce;
let sec_zoom;


let simulation_time = 3000; // ms
const linkStr = 0.1;

let is_updating_layout = false;

let step_by_step_is_active = false;
let next_step_required = false;
let previous_step_required = false;
let is_first_swap = true;
let is_push = true;

let chosen_version = -1;


let locales = ['en', 'ru'];
let chosen_locale = 'en';
let text_container_en = new Map([
    ['click_on_old_version_push',
        'We want to push new node to version {1}.\n' +
        'Let\'s highlight it.'],

    ['copy_old_version',
        'We start from copying all old version parameters into new one, so we can change it.\n' +
        'All further changes will be applied to the new version.'],

    ['push_new_node',
        'Now we link our new node {1} to the tail of new version in main tree.\n' +
        'Version tail pointer has changed to the new node as well.'],

    ['check_list_size',
        'Next step is probable change of auxiliary lists.\n' +
        'We compare new number of untracked queue nodes (black ones) with corresponding version\'s operational list size (blue nodes).'],

    ['list_size_ok',
        'Operational list size is {1}, untracked nodes amount is {2}.\n' +
        'List has bigger or same size as 1/2 of untracked nodes amount.\n' +
        'Nothing needs to be changed.'],

    ['list_size_needs_remaster',
        'Operational list size is {1}, untracked nodes amount is {2}.\n' +
        'List has lesser size comparing to 1/2 of untracked nodes amount.\n' +
        'We check if it\'s possible to swap operational and dynamic lists (in case, previous pop gave us possibility to do so).'],

    ['swap_success',
        'We successfully swapped lists, now dynamic list is empty.\n' +
        'Nothing else needs to be done.'],

    ['swap_failure',
        'We couldn\'t swap lists, so we need to create new additional dynamic list node.'],

    ['check_lists_swap_null',
        'We check if dynamic list reached corresponding version head.\n' +
        'In our case, dynamic list doesn\'t exist at all.'],

    ['check_lists_swap_',
        'We check if dynamic list reached corresponding version head.\n' +
        'In our case, version head is node {1}.\n' +
        'We perform following operations:\n' +
        '1) Get dynamic list node - it\'s node {2}.\n' +
        '2) Get it\'s targeted node in main tree - it\'s node {3}.\n' +
        '3) Get targeted node son - it\'s node {4}'],

    ['lists_swap_ok',
        'Dynamic list didn\'t reach list head, nothing changes.'],

    ['lists_swap_needed',
        'We got the same nodes, that means dynamic list has reached version head.\n' +
        'So we treat dynamic list as operational (e.g. swap them).'],

    ['define_targeted_node_1',
        'To do so, we need to define targeted node in main tree.\n' +
        'We make following operations:\n' +
        '1) Get current dynamic list node - it\'s node {1}.\n' +
        '2) Get from it targeted node in main tree - it\'s node {2}.\n' +
        '3) Get from targeted node it\'s son - node {3}.\n' +
        'So, now we know the targeted node for creating new dynamic node.\n '],

    ['define_targeted_node_2',
        'To do so, we need to define targeted node in main tree.\n' +
        'We just need to get son of the tail node:\n' +
        '1) Current tail is node {1}.\n' +
        '2) We get it\'s son - node {2}.\n' +
        'So, now we know the targeted node for creating new dynamic node.\n'],

    ['add_new_dynamic_node_1',
        'This way, we created new dynamic node.\n' +
        'Let\'s link it to the previous leading one.\n'],

    ['add_new_dynamic_node_2',
        'This way, we created new dynamic node.\n' +
        'Because there wasn\'t a dynamic list for previous version, dynamic node\'s son points to NULL.\n' +
        'Let\'s add it to the tree.'],

    ['try_swap_again',
        'Because we created new dynamic node, we need to try swapping operational and dynamic lists again.'],

    ['ended_pushing',
        'We ended pushing to our chosen version!'],

    ['click_on_old_version_pop',
        'We want to pop node from version {1}.\n' +
        'Let\'s select this version.'],

    ['define_node_to_pop',
        'Our head points at node {1}, so we want to pop it.'],

    ['pop_node_list_size_1',
        'We have only 1 node in our queue, so we can simply reset our pointers to head and tail to NULL.\n' +
        'Basically, our new version equals to starting N version.'],

    ['pop_node_list_size_2',
        'We have only 2 nodes in our queue, so we can simply change our version\'s head-pointer to tail-pointer.'],

    ['define_new_head_1',
        'We want to define, which node will be next head.\n' +
        'Since we have more than 2 nodes in queue, we can\'t do it straightforwardly.\n' +
        'So we will refer to our leading operational list node.'],

    ['define_new_head_2',
        'This operational node has two important parameters:\n' +
        '1) next operational node (it\'s son) - node {1},\n' +
        '2) targeted main queue node - node {2} in main tree.'],

    ['pop_node',
        'So now we know, how to create new version.\n' +
        'We simply change new version\'s head-pointer and operational list pointer to this nodes.'],

    ['ended_popping',
        'We ended popping from our chosen version!'],
]);
let text_container_ru = new Map([
    ['click_on_old_version_push',
        'Мы хотим добавить новую вершину к версии {1}.'],

    ['push_new_node',
        'Нам достаточно скопировать в новую версию всю информацию от старой и привязать новую вершину {1} к \'хвосту\' этой версии в главном графе.\n' +
        'Теперь у новой версии изменился \'хвост\'.'],

    ['check_list_size',
        'Мы сравниваем новое количество неотслеживаемых вершин (выделены черным цветом) с размером соответствующего операционного списка (выделен голубым цветом).'],

    ['list_size_ok',
        'Размер операционного списка - {1}, что больше или равно 1/2 от количества неотслеживаемых вершин.\n' +
        'Нет необходимости в изменениях.'],

    ['list_size_needs_remaster',
        'Размер операционного списка - {1}, что меньше чем 1/2 от количества неотслеживаемых вершин.\n' +
        'Проверим, можно ли поменять местами операционный и динамический списки (в случае, если предыдущее удаление вершины дало нам такое возможность).'],

    ['swap_success',
        'Мы успешно поменяли списки местами, теперь динамический список пуст.\n' +
        'Больше ничего менять не нужно.'],

    ['swap_failure',
        'Мы не смогли поменять местами списки, поэтому необходимо создать новую вершину для динамического листа.'],

    ['check_lists_swap_null',
        'Проверим, достиг ли динамический список \'головы\' текущей версии.\n' +
        'В нашем случае, динамический список отсутствует.'],

    ['check_lists_swap_',
        'Проверим, достиг ли динамический список \'головы\' текущей версии.\n' +
        'В нашем случае \'голова\' текущей версии - вершина {1}.\n' +
        'Проведём следующие операции:\n' +
        '1) Получим ведущую вершину динамического списка - это вершина {2}.\n' +
        '2) Из нее узнаем, на какую вершину она указывает в главном графе - это вершина {3}.\n' +
        '3) Осталось только получить сына этой вершины - вершину {4}'],

    ['lists_swap_ok',
        'Динамический список не достиг \'головы\' текущей версии, ничего не происходит.'],

    ['lists_swap_needed',
        'Мы получили одинаковые вершины, это значит что динамический список достиг \'головы\' текущей версии.\n' +
        'Поэтому, теперь мы принимаем динамический список за операционный (меняем их местами).'],

    ['define_targeted_node_1',
        'Чтобы это сделать, нам необходимо определить целевую вершину в главном графе и сына в динамическом списке.\n' +
        'Вторую мы уже знаем, так как сейчас ведущая вершина динамического списка - {1}.\n' +
        'Для нахождения первой нам необходимо выполнить следующие операции:\n' +
        '1) Получить ведущую вершину динамического списка - это вершина {1}.\n' +
        '2) Узнать из нее целевую вершину в главном графе - это вершина {2}.\n' +
        '3) Из этой вершины получить ее сына - вершину {3}.\n' +
        'Теперь, мы знаем необходимую целевую вершину для создания новой динамической вершины.'],

    ['define_targeted_node_2',
        'Чтобы это сделать, нам необходимо определить целевую вершину в главном графе и сына в динамическом списке.\n' +
        'Первую вершину мы можем найти, просто взяв сына \'хвоста\' текущей версии:\n' +
        '1) Текущий \'хвост\' - вершина {1}.\n' +
        '2) Ее сын - вершина {2}.\n' +
        'Теперь, мы знаем необходимую целевую вершину.\n' +
        'Так как у нас нет динамического списка для текущей вершины, положим сына новой динамической вершины равным NULL.'],

    ['add_new_dynamic_node',
        'Таким образом, мы создали новую ведущую динамическую вершину.\n' +
        'Добавим ее в граф.'],

    ['try_swap_again',
        'Снова попробуем поменять местами динамический и операционный списки местами.'],

    ['ended_pushing',
        'Мы успешно добавили вершину к выбранной версии!'],

    ['click_on_old_version_pop',
        'Мы хотим удалить вершину из версии {1}.\n' +
        'Рассмотрим ее.'],

    ['define_node_to_pop',
        '\'Голова\' текущей версии - вершина {1}, поэтому мы хотим удалить именно ее.'],

    ['pop_node_list_size_1',
        'В нашей очереди только 1 вершина, поэтому достаточно обнулить указатели на \'голову\' и \'хвост\' новой версии на NULL.\n' +
        'Проще говоря, новая версия теперь эквивалентна стартовой версии N.'],

    ['pop_node_list_size_2',
        'В нашей очереди есть только 2 вершины, поэтому достаточно в указатель на \'голову\' записать текущий указатель на \'хвост\'.'],

    ['define_new_head_1',
        'Мы хотим определить, какая вершина станет следующей \'головой\'.\n' +
        'Так как у нас больше 2 вершин в очереди, мы не сможем это сделать напрямую.\n' +
        'Поэтому, мы обратимся к операционномы списку текущей версии.\n' +
        'Ведущая вершина этого списка - вершина {1}.'],

    ['define_new_head_2',
        'В свою очередь, эта операционная вершина владее 2 важными параметрами:\n' +
        '1) следующая операционная вершина (ее сын) - вершина {1},\n' +
        '2) целевая вершина в главной очереди - вершина {2} в главном графе.\n' +
        'Нам потребуются оба этих параметра.'],

    ['pop_node',
        'Таким образом, мы знаем как создать новую версию. Сначала, скопируем новую версию из текущей.\n' +
        'Потом изменим голову новой версии на целевую вершину, которую мы узнали на предыдущем шаге.\n' +
        'Также изменим ведущую вершину операционного списка на сына текущей ведущей вершины.'],

    ['rebuild_dynamic_list',
        'Единственное, что осталось сделать - проверить, не нужно ли изменить динамический список.\n' +
        'Перестроим его, если это необходимо.'],

    ['ended_popping',
        'Мы успешно удалили вершину из выбранной версии!'],
]);
let text_containers = new Map([
    ['en', text_container_en],
    ['ru', text_container_ru],
]);

let html_page_locale_en = new Map([
    ['locale_switcher_label', 'Select locale:'],
    ['help_text', 'Here is some text.'],
    ['push_version_label', 'Push new element to specific version:'],
    ['push_button', 'Push'],
    ['pop_version_label', 'Pop last value from specific version:'],
    ['pop_button', 'Pop'],
    ['debug_button', 'Debug'],
    ['step_by_step_toggle_checkbox_label', 'Activate step-by-step'],
    ['update_layout_button', 'Update layout'],
    ['next_step_button', 'Next step'],
]);
let html_page_locale_ru = new Map([
    ['locale_switcher_label', 'Выберите язык:'],
    ['help_text', 'Небольшой текст.'],
    ['push_version_label', 'Добавить новую вершину к версии:'],
    ['push_button', 'Добавить'],
    ['pop_version_label', 'Удалить последнюю вершину из версии:'],
    ['pop_button', 'Удалить'],
    ['debug_button', 'Дебаг'],
    ['step_by_step_toggle_checkbox_label', 'Пошаговая визуализация'],
    ['update_layout_button', 'Обновить граф'],
    ['next_step_button', 'Следующий шаг'],
]);
let html_page_containers = new Map([
    ['en', html_page_locale_en],
    ['ru', html_page_locale_ru],
]);



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
function CopyLink(link) {
    return new Link(link.id, link.source.id, link.target.id, link.strength);
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

class State {
    constructor(args, function_call, old_sizes) {
        console.warn("store old state");
        if (_main_nodes.length !== old_sizes[0]) {
            console.log("store new main node");
            this.new_main_node = Object.assign({}, _main_nodes.at(-1));
        }
        if (_links.length !== old_sizes[1]) {
            console.log("store new main link");
            this.new_link = Object.assign({}, _links.at(-1));
        }
        if (_dynamic_nodes.length !== old_sizes[2]) {
            console.log("store new dynamic node");
            this.new_dynamic_node = Object.assign({}, _dynamic_nodes.at(-1));
        }
        if (_dynamic_links.length !== old_sizes[3]) {
            console.log("store new dynamic link");
            this.new_dynamic_link = Object.assign({}, _dynamic_links.at(-1));
        }
        if (_versions.length !== old_sizes[4]) {
            console.log("store new version");
            this.new_version = Object.assign({}, _versions.at(-1));
        }

        this.chosen_version = chosen_version;
        this.is_first_swap = is_first_swap;
        this.overall_id = overall_id;

        this.args = JSON.parse(JSON.stringify(args));
        this.function_call = function_call;
    }

    new_main_node = null;
    new_link = null;
    new_version = null;
    new_dynamic_node = null;
    new_dynamic_link = null;

    chosen_version;
    is_first_swap;
    overall_id;

    args;
    function_call;

    RestoreState(old_sizes) {
        if (_main_nodes.length !== old_sizes[0] && this.new_main_node === null) {
            _main_nodes.pop();
        }
        if (_links.length !== old_sizes[1] && this.new_link === null) {
            console.log("pop main link");
            _links.pop();
        }
        if (_dynamic_nodes.length !== old_sizes[2] && this.new_dynamic_node === null) {
            console.log("pop dynamic node");
            _dynamic_nodes.pop();
        }
        if (_dynamic_links.length !== old_sizes[3] && this.new_dynamic_link === null) {
            console.log("pop dynamic link");
            _dynamic_links.pop();
        }
        if (_versions.length !== old_sizes[4] && this.new_version === null) {
            console.log("pop version");
            _versions.pop();
        }
        if (this.new_main_node !== null) {
            _main_nodes[_main_nodes.length - 1] = Object.assign({}, this.new_main_node);
            console.log("changing last main node");
        }
        if (this.new_link !== null) {
            console.warn(this.new_link);
            _links[_links.length - 1] = CopyLink(this.new_link);
            console.log("changing last main link");
        }
        if (this.new_dynamic_node !== null) {
            _dynamic_nodes[_dynamic_nodes.length - 1] = Object.assign({}, this.new_dynamic_node);
            console.log("changing last dynamic node");
        }
        if (this.new_dynamic_link !== null) {
            _dynamic_links[_dynamic_links.length - 1] = Object.assign({}, this.new_dynamic_link);
            console.log("changing last dynamic link");
        }
        if (this.new_version !== null) {
            _versions[_versions.length - 1] = Object.assign({}, this.new_version);
            console.log("changing last version");
        }

        chosen_version = this.chosen_version;
        is_first_swap = this.is_first_swap;
        overall_id = this.overall_id;
        return [this.args, this.function_call];
    }
}

async function Push(parent_version_num = -1) {
    console.log(`Push called.`);
    if (parent_version_num < 0) {
        let form = document.getElementById('push_form');
        parent_version_num = form.push_version.value;
    }
    parent_version_num = ValidateInputVersion(parent_version_num);
    if (parent_version_num < 0) {
        return;
    }
    if (step_by_step_is_active) {
        is_push = true;
        await OperationsCoordinator(parent_version_num);
    } else {
        await Push__NoStepping(parent_version_num)
    }
    console.log('Push made successfully');
}
async function Pop(parent_version_num = -1) {
    console.log(`Pop called.`);
    if (parent_version_num < 0) {
        let form = document.getElementById('pop_form');
        parent_version_num = form.pop_version.value;
    }
    parent_version_num = ValidateInputVersion(parent_version_num);
    if (parent_version_num < 0) {
        return;
    }
    let parent_version = _versions[parent_version_num];
    if (parent_version.head === 0) {
        console.log(`Can't pop from empty version`);
        return;
    }
    if (step_by_step_is_active) {
        is_push = false;
        await OperationsCoordinator(parent_version_num);
    } else {
        await Pop__NoStepping(parent_version_num)
    }
    console.log('Pop made successfully');

}
function ValidateInputVersion(version_num) {
    if (version_num === 'b') {
        HideAll();
        return -1;
    }
    if (!isNum(version_num)) {
        console.log('Invalid input format.');
        return -1;
    }
    version_num = Number(version_num);
    if (version_num >= _versions.length) {
        console.log('Invalid version number.');
        return -1;
    }
    return version_num;
}

async function Push__NoStepping(parent_version_num) {
    StopUpdatingLayout();

    let parent_version = _versions[parent_version_num];
    console.log(`Parent version: ${parent_version_num}`)

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
    _versions.push(new Version(first_el, last_el, operational_list, dynamic_list, size, operational_list_size, dynamic_list_size, _versions.length, _versions.length, parent_version_num, x_coord, y_coord));

    await ChangeDynamicList__NoStepping(_versions[_versions.length - 1]);

    await UpdateLayout();
}
async function Pop__NoStepping(parent_version_num) {
    StopUpdatingLayout();

    console.log(`Parent version: ${parent_version_num}.`)
    let version = _versions[parent_version_num];

    let pop_value = _main_nodes[version.head].id;
    console.log(pop_value);
    let x_coord = _versions.at(-1).x + 30;
    let y_coord = _versions.at(-1).y;
    ++overall_id;

    if (version.size === 1) {
        _versions.push(new Version(0, 0, null, null, 0, 0, 0, _versions.length, _versions.length, parent_version_num, x_coord, y_coord));

        console.log('Pop made successfully');
        UpdateVersionsLayout();
        return;
    }

    if (version.size === 2) {
        _versions.push(new Version(version.tail, version.tail, null, null, 1, 0, 0, _versions.length, _versions.length, parent_version_num, x_coord, y_coord));

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
    _versions.push(new Version(first_el, last_el, operational_list, dynamic_list, size, operational_list_size, dynamic_list_size, _versions.length, _versions.length, parent_version_num, x_coord, y_coord));

    await ChangeDynamicList__NoStepping(_versions.at(-1));

    await UpdateLayout();
}
async function ListsExchange__NoStepping(version) {
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
async function ChangeDynamicList__NoStepping(version) {
    let curr_version_nodes_size = Math.max(0, version.size - 2);
    if (version.operational_list_size * 2 >= curr_version_nodes_size) {
        return;
    }
    if (await ListsExchange__NoStepping(version)) {
        return;
    }

    let targeted_main_node;
    if (version.dynamic_list !== null) {
        targeted_main_node = _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id;
    } else {
        targeted_main_node = _main_nodes[version.tail].son_id;
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

    await ListsExchange__NoStepping(version);
}

async function OperationsCoordinator(parent_version_num) {
    StopUpdatingLayout();
    PrepareStepByStepLayout();

    is_first_swap = true;
    let next_function_call;
    if (is_push) {
        next_function_call = PreparePush;
    } else {
        next_function_call = PreparePop;
    }
    let states = [];
    let args = [parent_version_num];
    let old_size = [_main_nodes.length, _links.length, _dynamic_nodes.length, _dynamic_links.length, _versions.length]

    let index = -2;
    let action = "";
    while (next_function_call !== "End") {
        states[index + 2] = new State(args, next_function_call, old_size);
        console.warn("Save st before fcall", next_function_call, "at ind", index + 2);
        ++index;
        console.log("Calling ", next_function_call, args);
        [next_function_call, args] = await next_function_call(args);
        HighlightVersion(chosen_version);
        console.log("Next call ", next_function_call, args);
        console.log(states);
        action = await WaitForNextAction();
        while (action === "prev") {
            if (index < 0) {
                action = await WaitForNextAction();
            } else {
                console.info("getting previous state ", states[index]);
                [args, next_function_call] = states[index].RestoreState(old_size);
                console.log("got state before calling ", next_function_call, " at ind ", index);
                index -= 2;
                await UpdateLayout__NoPhysics();
                break;
            }
        }
    }

    ReturnFromStepByStepLayout();
    await UpdateLayout();
}

async function PreparePush([parent_version_num]) {
    console.log(`Parent version: ${parent_version_num}`)

    GetNextStepText("click_on_old_version_push", parent_version_num);
    HighlightVersion(parent_version_num);
    return [CopyOldVersion, [parent_version_num]];
}
async function CopyOldVersion([parent_version_num]) {
    let parent_version = _versions[parent_version_num];

    let x_coord = _versions.at(-1).x + 32;
    let y_coord = _versions.at(-1).y;

    let first_el = parent_version.head;
    let last_el = parent_version.tail;
    let operational_list = parent_version.operational_list;
    let dynamic_list = parent_version.dynamic_list;
    let size = parent_version.size;
    let operational_list_size = parent_version.operational_list_size;
    let dynamic_list_size = parent_version.dynamic_list_size;
    _versions.push(new Version(first_el, last_el, operational_list, dynamic_list, size, operational_list_size, dynamic_list_size, _versions.length, _versions.length, parent_version_num, x_coord, y_coord));

    GetNextStepText("copy_old_version");
    await UpdateVersionsLayout__NoPhysics();

    if (is_push) {
        return [AddMainNode, [parent_version_num]];
    }
    return [DefineNodeToPop, [parent_version_num]];
}
async function AddMainNode([parent_version_num]) {
    let parent_version = _versions[parent_version_num];
    let x_coord = _main_nodes[parent_version.tail].x - 30 - GetRandomInt(5);
    let y_coord = _main_nodes[parent_version.tail].y - 30 - GetRandomInt(5);
    _main_nodes.push(new Node(parent_version.tail, _main_nodes.length, overall_id++, x_coord, y_coord));
    let new_node = _main_nodes.length - 1;

    _links.push(new Link(_links.length, new_node, _main_nodes[new_node].son_id));

    let version = _versions.at(-1);
    version.head = parent_version.head !== 0 ? parent_version.head : new_node;
    version.tail = new_node;
    version.size = parent_version.size + 1;

    await UpdateMainLayout__NoPhysics();
    HighlightVersion(_versions.length - 1)
    GetNextStepText("push_new_node", _main_nodes[new_node].label);
    return [DefineDynamicListSize, [_versions.length - 1]];
}

async function DefineDynamicListSize([version_num]) {
    GetNextStepText("check_list_size");
    return [CheckDynamicListSize, [version_num]];
}
async function CheckDynamicListSize([version_num]){
    let version = _versions[version_num];
    let untracked_nodes_amount = Math.max(0, version.size - 2);
    if (version.operational_list_size * 2 >= untracked_nodes_amount) {
        GetNextStepText("list_size_ok", version.operational_list_size, untracked_nodes_amount);
        if (is_push) {
            return [EndPushing, []];
        }
        return [EndPopping, []];
    } else {
        GetNextStepText("list_size_needs_remaster", version.operational_list_size, untracked_nodes_amount);
        return [CheckListsSwap, [version_num]];
    }
}
async function CheckListsSwap([version_num]) {
    let version = _versions[version_num];
    if (version.dynamic_list === null) {
        is_first_swap = false;
        GetNextStepText("check_lists_swap_null");
        return [TargetedNodeDefining, [version_num]];
    } else {
        let head = version.head;
        let dynamic_list = version.dynamic_list;
        let targeted_node = _dynamic_nodes[version.dynamic_list].target_node;
        let targeted_node_son = _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id
        GetNextStepText("check_lists_swap_", _main_nodes[head].label, _dynamic_nodes[dynamic_list].label, _main_nodes[targeted_node].label, _main_nodes[targeted_node_son].label);
        return [ConfirmListsSwap, [version_num]];
    }
}
async function ConfirmListsSwap([version_num]) {
    let version = _versions[version_num];
    if (version.dynamic_list !== null && _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id === version.head) {
        console.log('Dynamic and operational lists swapped.');
        version.operational_list = version.dynamic_list;
        version.operational_list_size = version.dynamic_list_size;
        version.dynamic_list = null;
        version.dynamic_list_size = 0;

        GetNextStepText("lists_swap_needed");
        HighlightVersion(version_num);
        if (is_first_swap) {
            is_first_swap = false;
            return [FirstSwapSuccess, []];
        }
        if (is_push) {
            return [EndPushing, []];
        }
        return [EndPopping, []];
    }
    if (is_first_swap) {
        is_first_swap = false;
        GetNextStepText("swap_failure");
        return [TargetedNodeDefining, [version_num]];
    }
    GetNextStepText("lists_swap_ok");
    if (is_push) {
        return [EndPushing, []];
    }
    return [EndPopping, []];
}
async function FirstSwapSuccess() {
    GetNextStepText("swap_success");
    if (is_push) {
        return [EndPushing, []];
    }
    return [EndPopping, []];
}
async function TargetedNodeDefining([version_num]) {
    let new_targeted_main_node;
    let version = _versions[version_num];
    if (version.dynamic_list !== null) {
        let dynamic_node = version.dynamic_list;
        let targeted_node = _dynamic_nodes[version.dynamic_list].target_node;
        new_targeted_main_node = _main_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id;
        GetNextStepText("define_targeted_node_1", _dynamic_nodes[dynamic_node].label, _main_nodes[targeted_node].label, _main_nodes[new_targeted_main_node].label);
    } else {
        let tail = version.tail;
        new_targeted_main_node = _main_nodes[version.tail].son_id;
        GetNextStepText("define_targeted_node_2", _main_nodes[tail].label, _main_nodes[new_targeted_main_node].label);
    }
    return [NewDynamicNodeCreation, [version_num, new_targeted_main_node]];

}
async function NewDynamicNodeCreation([version_num, targeted_main_node]) {
    let version = _versions[version_num];

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

    if (version.dynamic_list !== null) {
        GetNextStepText("add_new_dynamic_node_1");
    } else {
        GetNextStepText("add_new_dynamic_node_2");
    }

    await UpdateSecondaryLayout__NoPhysics();
    HighlightVersion(version_num);

    return [TrySwappingListsAgain, [version_num]];
}
async function TrySwappingListsAgain([version_num]) {
    GetNextStepText("try_swap_again");
    return [CheckListsSwap, [version_num]];
}

async function EndPushing() {
    GetNextStepText("ended_pushing");
    return ["End", []];
}

async function PreparePop([parent_version_num]) {
    console.log(`Parent version: ${parent_version_num}.`)

    GetNextStepText("click_on_old_version_pop", parent_version_num);
    HighlightVersion(parent_version_num);
    return [CopyOldVersion, [parent_version_num]];
}
async function DefineNodeToPop([parent_version_num]) {
    let parent_version = _versions[parent_version_num];
    let head = parent_version.head;
    GetNextStepText("define_node_to_pop", _main_nodes[head].label);
    ++overall_id;
    if (parent_version.size === 1) {
        return [QueueSizeIs1, []];
    }
    if (parent_version.size === 2) {
        return [QueueSizeIs2, []];
    }
    return [QueueSizeNormal, [parent_version_num]];
}
async function QueueSizeIs1() {
    let version = _versions.at(-1);
    version.head = 0;
    version.tail = 0;
    version.size = 0;
    HighlightVersion(_versions.length - 1);
    GetNextStepText("pop_node_list_size_1");
    return [EndPopping, []];
}
async function QueueSizeIs2() {
    let version = _versions.at(-1);
    version.head = version.tail;
    version.size = 1;
    HighlightVersion(_versions.length - 1);
    GetNextStepText("pop_node_list_size_2");
    return [EndPopping, []];
}
async function QueueSizeNormal([parent_version_num]) {
    GetNextStepText("define_new_head_1");
    return [DefineNewHead, [parent_version_num]];
}
async function DefineNewHead([parent_version_num]) {
    let parent_version = _versions[parent_version_num];
    let operational_list = _dynamic_nodes[parent_version.operational_list].next_list;
    let first_el = _dynamic_nodes[parent_version.operational_list].target_node;
    GetNextStepText("define_new_head_2", _dynamic_nodes[operational_list].label, _main_nodes[first_el].label);
    return [ShowNewVersion, [parent_version_num]];
}
async function ShowNewVersion([parent_version_num]) {
    let parent_version = _versions[parent_version_num];
    let version = _versions.at(-1);
    version.head = _dynamic_nodes[parent_version.operational_list].target_node;
    version.operational_list = _dynamic_nodes[parent_version.operational_list].next_list;
    version.size = parent_version.size - 1;
    version.operational_list_size = parent_version.operational_list_size - 1;
    GetNextStepText("pop_node");
    HighlightVersion(_versions.length - 1);
    return [DefineDynamicListSize, [_versions.length - 1]];
}
async function EndPopping() {
    GetNextStepText("ended_popping");
    return ["End", []];
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
    await Push__NoStepping(0);
    await Push__NoStepping(1);
    await Push__NoStepping(2);
    await Push__NoStepping(3);
    await Push__NoStepping(4);
    await Push__NoStepping(5);
    await Push__NoStepping(5);
    await Push__NoStepping(5);
    await Push__NoStepping(5);
    await Push__NoStepping(6);
    await Push__NoStepping(1);
    await Push__NoStepping(7);
    await Push__NoStepping(12);
    await Push__NoStepping(11);
    simulation_time = 3000;
    await Push__NoStepping(14);
}
function HideAll() {
    let allElements = document.querySelectorAll('body > *');
    for (let element of allElements) {
        element.hidden = true;
    }
    document.getElementById('banan').style.visibility = 'visible';
}

async function WaitForNextAction() {
    while (!next_step_required && !previous_step_required) {
        await sleep(10);
    }
    if (next_step_required) {
        next_step_required = false;
        return "next";
    } else {
        previous_step_required = false;
        return "prev";
    }
}
function NextStep() {
    if (step_by_step_is_active) {
        next_step_required = true
    }
}
function PreviousStep() {
    if (step_by_step_is_active) {
        previous_step_required = true
    }
}

function PrepareStepByStepLayout() {
    document.getElementById('push_form').hidden = true;
    document.getElementById('pop_form').hidden = true;
    document.getElementById('debug_button').hidden = true;
    document.getElementById('step_by_step_cont').hidden = true;
    document.getElementById('update_layout_button').hidden = true;
    document.getElementById('next_step_button').hidden = false;
    document.getElementById('previous_step_button').hidden = false;
}
function ReturnFromStepByStepLayout() {
    document.getElementById('push_form').hidden = false;
    document.getElementById('pop_form').hidden = false;
    document.getElementById('debug_button').hidden = false;
    document.getElementById('step_by_step_cont').hidden = false;
    document.getElementById('update_layout_button').hidden = false;
    document.getElementById('next_step_button').hidden = true;
    document.getElementById('previous_step_button').hidden = true;
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
        .on('mouseover', PopupMouseOver)
        .on('mouseout', PopupMouseOut)

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
    let g_nodes = ver_svg.select('g.nodes')
        .selectAll('circle')
        .data(_versions, d => d.id);
    g_nodes.exit().remove();
    g_nodes
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'version_node')
        .attr('id', function (node) {
            return node.id
        })
        .on('click', VersionClick)
        .on('mouseover', PopupMouseOver)
        .on('mouseout', PopupMouseOut)

    let g_texts = ver_svg.select('g.texts')
        .selectAll('text')
        .data(_versions, d => d.id);
    g_texts.exit().remove();
    g_texts
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
    await sleep(15);
    StopUpdatingVersionsLayout();
}

function SetupMainSVG() {
    main_svg = d3.select('#main_svg');

    main_svg.attr('width', main_width)
        .attr('height', main_height)
        .style('background', 'cyan')

    linkForce = d3
        .forceLink()
        .id(function (link) {
            return link.id
        })
        .strength(function (link) {
            return link.strength
        })

    main_sim = d3
        .forceSimulation()
        .force('link', linkForce)
        .force('charge', d3.forceManyBody().strength(-50))
        .force('center', d3.forceCenter(main_width / 2, main_height / 2))

    main_svg.append('g')
        .attr('class', 'links')

    main_svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(_main_nodes)
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'regular_node')
        .attr('id', function (node) {
            return node.id
        })

    main_svg.append('g')
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

    main_zoom = d3.zoom()
        .scaleExtent([0.2, 5])
        // .translateExtent([[0, 0], [width, height]])
        .on('zoom', HandleZoom);
    d3.select('#main_svg')
        .call(main_zoom);

    const markerBoxWidth = 8;
    const markerBoxHeight = 5;
    const refX = markerBoxWidth / 2;
    const refY = markerBoxHeight / 2;
    const markerWidth = markerBoxWidth / 2;
    const markerHeight = markerBoxHeight / 2;
    const arrowPoints = [[0, 0], [0, 8], [5, 4]];

    main_svg
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

    main_sim.force('link').links(_links)
}
function MakeMovableMain() {
    let linkElements = main_svg.select('g.links').selectAll("line")
    let nodeElements = main_svg.select('g.nodes').selectAll("circle")
    let textElements = main_svg.select('g.texts').selectAll("text")

    main_sim.nodes(_main_nodes).on('tick', () => {
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
    let g_links = main_svg.select('g.links')
        .selectAll('line')
        .data(_links, d => d.id);
    g_links.exit().remove();
    g_links
        .enter().append('line')
        .attr('class', 'arrow_link')
        .attr('id', function (link) {
            return link.id
        })

    let g_nodes = main_svg.select('g.nodes')
        .selectAll('circle')
        .data(_main_nodes, d => d.id);
    g_nodes.exit().remove();
    g_nodes
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'regular_node')
        .attr('id', function (node) {
            return node.id
        })

    let g_texts = main_svg.select('g.texts')
        .selectAll('text')
        .data(_main_nodes, d => d.id);
    g_texts.exit().remove();
    g_texts
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

    main_sim
        .alpha(0.5)
        .alphaTarget(0.3)
        .restart();
}
function StopUpdatingMainLayout() {
    main_sim.stop();
}
async function UpdateMainLayout__NoPhysics() {
    UpdateMainLayout();
    await sleep(15);
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
    let g_links = sec_svg.select('g.links')
        .selectAll('line')
        .data(_dynamic_links, d => d.id);
    g_links.exit().remove();
    g_links
        .enter().append('line')
        .attr('class', 'arrow_link')
        .attr('id', function (link) {
            return link.id
        })

    let g_nodes = sec_svg.select('g.nodes')
        .selectAll('circle')
        .data(_dynamic_nodes, d => d.id);
    g_nodes.exit().remove();
    g_nodes
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'regular_node')
        .attr('id', function (node) {
            return node.id
        })

    let g_texts = sec_svg.select('g.texts')
        .selectAll('text')
        .data(_dynamic_nodes, d => d.id);
    g_texts.exit().remove();
    g_texts
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
    await sleep(15);
    StopUpdatingSecondaryLayout();
}

async function Setup() {
    BindLocaleSwitcher();
    BindStepByStepToggler();

    _versions.push(new Version(0, 0, null, null, 0, 0, 0, 0, 'N', null, 25, 25));
    _main_nodes.push(new Node(null, 0, 'Null', 40, 40));
    _dynamic_nodes.push(new ListNode(null, null, 0, 'Null', 40, 40));

    SetupVersionSVG();
    SetupMainSVG();
    SetupSecondarySVG();
    await sleep(50);
    is_updating_layout = true;
    StopUpdatingLayout();
}
function BindLocaleSwitcher() {
    let switcher = document.querySelector("[id=locale_switcher]");
    switcher.onchange = (event) => {
        SetLocale(event.target.value);
    };
}
function SetLocale(new_locale) {
    if (new_locale === chosen_locale) {
        return;
    }
    chosen_locale = new_locale;
    html_page_containers.get(chosen_locale).forEach((translation, id) => {
        document.getElementById(id).innerText = translation;
    });
}
function BindStepByStepToggler() {
    let switcher = document.querySelector("[id=step_by_step_toggle_checkbox]");
    switcher.onchange = (event) => {
        step_by_step_is_active = !step_by_step_is_active;
    };
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
        main_sim.stop();
        sec_sim.stop();
        ver_sim.stop();
        is_updating_layout = false;
    }
}
async function UpdateLayout__NoPhysics() {
    console.log(`Started updating version layout`);
    await UpdateVersionsLayout__NoPhysics();
    await UpdateMainLayout__NoPhysics();
    await UpdateSecondaryLayout__NoPhysics();
    console.log(`Ended reshaping layout`);
}


function HighlightVersion(version_num) {
    if (chosen_version === version_num) {
        ver_svg.select('g.nodes').select("[id='" + version_num + "']").dispatch('click');
        ver_svg.select('g.nodes').select("[id='" + version_num + "']").dispatch('click');
    } else {
        ver_svg.select('g.nodes').select("[id='" + version_num + "']").dispatch('click');
    }
}
function VersionClick(event) {
    console.log(`Version ${event.target.id} was clicked.`);
    let version = _versions[event.target.id];


    if (chosen_version === version.id) { // Version is same, return graph to default
        main_svg.select('g.nodes')
            .selectAll('circle')
            .attr('class', 'regular_node');
        main_svg.select('g.links')
            .selectAll('line')
            .attr('class', 'arrow_link');
        main_svg.select('g.texts')
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
    main_svg.select('g.links')
        .selectAll('line')
        .attr('class', 'faint_arrow_link');
    main_svg.select('g.nodes')
        .selectAll('circle')
        .attr('class', 'faint_node');
    main_svg.select('g.texts')
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
        main_svg.select('g.nodes')   // Null version, show null node only
            .select("[id='0']")
            .attr('class', 'null_node');
        main_svg.select('g.texts')
            .select("[id='0']")
            .attr('class', 'graph_text');
        return;
    }

    let curr_node = main_svg.select('g.nodes')   // Draw the body with black nodes
        .select("[id='" + version.tail + "']");
    let curr_link = main_svg.select('g.links')
        .select("[id='" + (version.tail - 1) + "']");
    let curr_text = main_svg.select('g.texts')
        .select("[id='" + version.tail + "']");
    while (Number(curr_node.attr('id')) >= version.head) {
        curr_node.attr('class', 'mid_node');
        if (Number(curr_node.attr('id')) > version.head) {
            curr_link.attr('class', 'arrow_link');
        }
        curr_text.attr('class', 'graph_text');
        curr_link = main_svg.select('g.links')
            .select("[id='" + (_main_nodes[Number(curr_node.attr('id'))].son_id - 1) + "']");
        curr_node = main_svg.select('g.nodes')
            .select("[id='" + _main_nodes[Number(curr_node.attr('id'))].son_id + "']");
        curr_text = main_svg.select('g.texts')
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


    main_svg.select('g.nodes')       // Draw head and tail nodes
        .select("[id='" + version.head + "']")
        .attr('class', 'head_node');
    main_svg.select('g.nodes')
        .select("[id='" + version.tail + "']")
        .attr('class', 'tail_node');


    console.log(`Parameters were reassigned.`);
}

function PopupMouseOver(event, object) {
    console.log('mouse in');
    let popup = document.getElementById('popup');
    let x_coord = object.x;
    let y_coord = object.y + 50;
    console.log(x_coord, y_coord)
    popup.style.left = x_coord + 'px';
    popup.style.top = y_coord + 'px';
    let head = _main_nodes[object.head].label;
    let tail = _main_nodes[object.tail].label;
    let leading_dynamic = object.dynamic_list !== null ? _dynamic_nodes[object.dynamic_list].label : 'Null';
    let leading_operational = object.operational_list !== null ? _dynamic_nodes[object.operational_list].label : 'Null';
    document.getElementById('head_id').innerHTML = ' ' + head;
    document.getElementById('tail_id').innerHTML = ' ' + tail;
    document.getElementById('dynamic_id').innerHTML = ' ' + leading_dynamic;
    document.getElementById('operational_id').innerHTML = ' ' + leading_operational;
    popup.hidden = false;
}
function PopupMouseOut() {
    console.log('mouse out');
    let popup = document.getElementById("popup");
    popup.hidden = true;
}

function GetNextStepText() {
    let option = arguments[0];
    let text = document.getElementById('help_text');
    let sample = text_containers.get(chosen_locale).get(option);

    text.innerHTML = sample.replace(/{(\d+)}/g, (match, index) => {
        let needed_arg = Number(match.substring(1, match.length - 1));
        if (arguments[needed_arg] === undefined) {
            console.error('Missing parameters for main text.', sample, option);
        }
        return arguments[needed_arg];
    });
}









