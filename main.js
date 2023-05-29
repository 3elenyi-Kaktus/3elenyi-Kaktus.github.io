//TODO
// dark theme
//TODO
// random graph creation with different parameters

let _nodes = [];
let _links = [];
let _dynamic_nodes = [];
let _dynamic_links = [];
let _versions = [];


let ver_svg;
let ver_sim;


let main_svg;
let main_sim;
let main_linkForce;
let main_zoom;


let sec_svg;
let sec_sim;
let sec_linkForce;
let sec_zoom;


let simulation_time = 3000; // ms
const linkStr = 0.1;
let overall_id = 1;

let is_updating_layout = false;

let step_by_step_is_active = false;
let next_step_required = false;
let previous_step_required = false;
let break_out = false;
let is_first_swap = true;
let is_push = true;
let highlighters;

let chosen_version = -1;
let chosen_config = 'none';
let observer = {
    stop: false
};
let instruction_is_open = false;
let random_graph_params_is_open = false;


let chosen_locale = 'not_defined';
let text_container_en = new Map([
    ['click_on_old_version_push',
        'We want to push new node to version {1}.\n' +
        'Let\'s highlight it.'],

    ['copy_old_version',
        'We start from copying all old version parameters into new one, so we can change it.\n' +
        'All further calculations and changes will be applied to the new version.'],

    ['define_tail_node_to_link',
        'We want to link our new node to the tail of new version in main tree, so we need to define it.\n' +
        'It\'s node {1}, which we can get from version pointers.'],

    ['push_new_node',
        'Now we link our new node {1} to the defined tail.\n' +
        'Also, we change version\'s tail pointer to the new node.'],

    ['dynamic_list_exists',
        'Dynamic list exists, so we try swapping it with the operational one.'],

    ['dynamic_list_absent',
        'Dynamic list doesn\'t exist yet for this version.\n' +
        'So, next step is checking the dynamic list creation criteria.\n' +
        'We compare new number of untracked queue nodes (black ones) with corresponding version\'s operational list size (blue nodes).'],

    ['criteria_not_fulfilled',
        'Operational list size is {1}, untracked nodes amount is {2}.\n' +
        'List has bigger or same size as 1/2 of untracked nodes amount.\n' +
        'Criteria isn\'t fulfilled, so nothing needs to be changed.'],

    ['criteria_fulfilled',
        'Operational list size is {1}, untracked nodes amount is {2}.\n' +
        'List has lesser size comparing to 1/2 of untracked nodes amount.\n' +
        'Criteria is fulfilled, so we have to start building new dynamic list.'],

    ['swap_success',
        'We successfully swapped lists, now dynamic list is empty.\n' +
        'Nothing else needs to be done.'],

    ['first_swap_failed',
        'Version head is node {1}, which isn\'t same node which we got earlier.\n' +
        'We couldn\'t swap lists, so we need to create new additional dynamic list node.'],

    ['dynamic_list_is_null',
        'We check if dynamic list reached corresponding version head.\n' +
        'In our case, dynamic list doesn\'t exist at all.\n' +
        'So we can go directly to creating a new one.'],

    ['get_leading_dynamic_node',
        'To swap lists we have to check if dynamic list reached corresponding version head.\n' +
        'We perform following operations:\n' +
        '1) Get leading dynamic list node - it\'s node {1}.'],

    ['get_targeted_main_node',
        'To swap lists we have to check if dynamic list reached corresponding version head.\n' +
        'We perform following operations:\n' +
        '1) Get leading dynamic list node - it\'s node {1}.\n' +
        '2) Get it\'s targeted node in main tree - it\'s node {2}.'],

    ['get_targeted_node_son',
        'To swap lists we have to check if dynamic list reached corresponding version head.\n' +
        'We perform following operations:\n' +
        '1) Get leading dynamic list node - it\'s node {1}.\n' +
        '2) Get it\'s targeted node in main tree - it\'s node {2}.\n' +
        '3) Get targeted node son - it\'s node {3}.'],

    ['second_swap_failed',
        'Version head is node {1}, which isn\'t same node which we got earlier.\n' +
        'That means, dynamic list didn\'t reach list head, nothing changes.'],

    ['reached_head_swap_confirmed',
        'Version head is node {1}, which is the same as we got earlier.\n' +
        'That means dynamic list has reached version head.\n' +
        'So we treat dynamic list as operational (e.g. swap them).'],

    ['define_targeted_node',
        'To do so, we need to define targeted node in main tree.\n' +
        'It will be node {1}, which we got during previous check of dynamic list on head reaching.'],

    ['define_targeted_node_null',
        'To do so, we need to define targeted node in main tree.\n' +
        'We just need to get son of the tail node:\n' +
        '1) Current tail is node {1}.'],

    ['define_targeted_node_null2',
        'To do so, we need to define targeted node in main tree.\n' +
        'We just need to get son of the tail node:\n' +
        '1) Current tail is node {1}.\n' +
        '2) We get it\'s son - node {2}.\n' +
        'So, now we know the targeted node for creating new dynamic node.'],

    ['add_new_dynamic_node_1',
        'Now we can add new dynamic node to the tree.\n' +
        'Let\'s link it to the currently leading one.'],

    ['add_new_dynamic_node_2',
        'This way, we created new dynamic node.\n' +
        'Because there wasn\'t a dynamic list for current version, dynamic node\'s son points to NULL.\n' +
        'Let\'s add it to the tree.'],

    ['try_swap_again',
        'Because we created new dynamic node, we need to try swapping operational and dynamic lists.'],

    ['ended_pushing',
        'We ended pushing to our chosen version!'],

    ['click_on_old_version_pop',
        'We want to pop node from version {1}.\n' +
        'Let\'s select this version.'],

    ['define_node_to_pop',
        'Our head points at node {1}, so we want to pop it.'],

    ['pop_node_list_size_1',
        'We have only 1 node in our queue, so we can simply reset our pointers to head and tail to NULL.\n' +
        'Basically, our new version equals to starting 0 version.'],

    ['pop_node_list_size_2',
        'We have only 2 nodes in our queue, so we can simply change our version\'s head-pointer to tail-pointer.'],

    ['define_new_head_1',
        'We want to define, which node will be next head.\n' +
        'Since we have more than 2 nodes in queue, we can\'t do it straightforwardly.\n' +
        'So we will refer to our leading operational list node - node {1}.'],

    ['define_new_head_2',
        'This operational node has two important parameters:\n' +
        '1) next operational node (it\'s son) - node {1}.'],

    ['define_new_head_3',
        'This operational node has two important parameters:\n' +
        '1) next operational node (it\'s son) - node {1}.\n' +
        '2) targeted node - node {2} in main tree.'],

    ['pop_node',
        'So now we know, how to pop the head node from current version.\n' +
        'We simply change new version\'s head-pointer and operational list pointer to this nodes.'],

    ['ended_popping',
        'We ended popping from our chosen version!'],
]);
let text_container_ru = new Map([
    ['click_on_old_version_push',
        'Мы хотим добавить новую вершину к версии {1}.\n' +
        'Подсветим ее.'],

    ['copy_old_version',
        'Начнем с того, что создадим новую версию, в которую скопируем все параметры от старой.\n' +
        'Все дальнейшие расчеты и изменения производятся и применяются к новой версии.'],

    ['define_tail_node_to_link',
        'Мы хотим привязать новую вершину к хвостовой вершине текущей версии, поэтому нам необходимо ее определить.\n' +
        'Это вершина {1}, которую мы можем получить из указателей версии.'],

    ['push_new_node',
        'Теперь мы можем привязать новую вершину {1} к \'хвосту\' этой версии в главном графе.\n' +
        'Также изменим указатель на \'хвост\' у версии.'],

    ['dynamic_list_exists',
        'Динамический список существует, поэтому попробуем поменять его с операционным местами.'],

    ['dynamic_list_absent',
        'Динамический список еще не был создан для этой версии.\n' +
        'Поэтому, проверим критерий построения нового списка.\n' +
        'Для этого мы сравниваем новое количество неотслеживаемых вершин (выделены черным цветом) с размером соответствующего операционного списка (выделен голубым цветом).'],

    ['criteria_not_fulfilled',
        'Размер операционного списка - {1}, а неотслеживаемых вершин - {2}.\n' +
        'То есть, список больше или равен 1/2 количества неотслеживаемых вершин.\n' +
        'Критерий создания динамического списка не выполнен, никакие изменения не требуются.'],

    ['criteria_fulfilled',
        'Размер операционного списка - {1}, а неотслеживаемых вершин - {2}.\n' +
        'То есть, список меньше, чем 1/2 количества неотслеживаемых вершин.\n' +
        'Критерий создания динамического списка выполняется, поэтому создадим его.'],

    ['swap_success',
        'Мы успешно поменяли списки местами, теперь динамический список пуст.\n' +
        'Больше ничего менять не нужно.'],

    ['first_swap_failed',
        '\'Голова\' этой версии - вершина {1}, она не сопадает с полученной нами ранее вершиной.\n' +
        'Мы не можем поменять списки местами, поэтому необходимо создать новую вершину для динамического списка.'],

    ['dynamic_list_is_null',
        'Проверим, достиг ли динамический список \'головы\' текущей версии.\n' +
        'В нашем случае, динамический список отсутствует.\n' +
        'Поэтому, можем сразу начать с создания нового.'],

    ['get_leading_dynamic_node',
        'Чтобы поменять списки местами, необходимо проверить достиг ли динамический список \'головы\' текущей версии.\n' +
        'Для этого проведем следующие операции:\n' +
        '1) Получим ведущую вершину динамического списка - это вершина {1}.'],

    ['get_targeted_main_node',
        'Чтобы поменять списки местами, необходимо проверить достиг ли динамический список \'головы\' текущей версии.\n' +
        'Для этого проведем следующие операции:\n' +
        '1) Получим ведущую вершину динамического списка - это вершина {1}.\n' +
        '2) Из нее узнаем, на какую вершину она указывает в главном графе - это вершина {2}.'],

    ['get_targeted_node_son',
        'Чтобы поменять списки местами, необходимо проверить достиг ли динамический список \'головы\' текущей версии.\n' +
        'Для этого проведем следующие операции:\n' +
        '1) Получим ведущую вершину динамического списка - это вершина {1}.\n' +
        '2) Из нее узнаем, на какую вершину она указывает в главном графе - это вершина {2}.\n' +
        '3) И находим сына этой вершины - вершину {3}.'],

    ['second_swap_failed',
        '\'Голова\' текущей версии - вершина {1}, которая не совпадает с полученной нами ранее.\n' +
        'Значит, динамический список не достиг \'головы\' текущей версии, ничего не изменяется.'],

    ['reached_head_swap_confirmed',
        '\'Голова\' текущей версии - вершина {1}, которая совпадает с полученной нами ранее.' +
        'Это означает, что динамический список достиг \'головы\' текущей версии.\n' +
        'Поэтому, теперь мы принимаем динамический список за операционный (меняем их местами).'],

    ['define_targeted_node',
        'Чтобы это сделать, нам необходимо определить целевую вершину в главном графе.\n' +
        'Ей будет вершина {1}, которую мы получили ранее при проверке на достижение динамическим списком \'головы\'.'],

    ['define_targeted_node_null',
        'Чтобы это сделать, нам необходимо определить целевую вершину в главном графе.\n' +
        'Для этого достаточно просто найти сына \'хвоста\' текущей версии:\n' +
        '1) Текущий \'хвост\' - вершина {1}.'],

    ['define_targeted_node_null2',
        'Чтобы это сделать, нам необходимо определить целевую вершину в главном графе.\n' +
        'Для этого достаточно просто найти сына \'хвоста\' текущей версии:\n' +
        '1) Текущий \'хвост\' - вершина {1}.\n' +
        '2) Ее сын - вершина {2}.\n' +
        'Теперь, мы знаем необходимую целевую вершину для создания новой динамической вершины.'],

    ['add_new_dynamic_node_1',
        'Теперь, мы можем добавить новую динамическую вершину к графу.\n' +
        'Привяжем ее к текущей ведущей динамической вершине.'],

    ['add_new_dynamic_node_2',
        'Таким образом, мы создали новую динамическую вершину.\n' +
        'Так как у текущей версии не было динамического списка, привяжем ее к указателю на NULL.\n'],

    ['try_swap_again',
        'Так как мы создали новую динамическую вершину, попробуем поменять местами динамический и операционный списки местами.'],

    ['ended_pushing',
        'Мы успешно добавили вершину к выбранной версии!'],

    ['click_on_old_version_pop',
        'Мы хотим удалить вершину из версии {1}.\n' +
        'Подсветим ее.'],

    ['define_node_to_pop',
        '\'Голова\' текущей версии - вершина {1}, поэтому мы хотим удалить именно ее.'],

    ['pop_node_list_size_1',
        'В нашей очереди только 1 вершина, поэтому достаточно обнулить указатели на \'голову\' и \'хвост\' текущей версии на NULL.\n' +
        'Проще говоря, теперь эта версия эквивалентна стартовой версии 0.'],

    ['pop_node_list_size_2',
        'В нашей очереди есть только 2 вершины, поэтому достаточно в указатель на \'голову\' записать текущий указатель на \'хвост\'.'],

    ['define_new_head_1',
        'Мы хотим определить, какая вершина станет следующей \'головой\'.\n' +
        'Так как у нас больше 2 вершин в очереди, мы не сможем это сделать напрямую.\n' +
        'Поэтому, мы обратимся к ведущей вершине операционного списка - вершине {1}.'],

    ['define_new_head_2',
        'Эта операционная вершина владеет 2 важными параметрами:\n' +
        '1) следующая операционная вершина (ее сын) - вершина {1}.'],

    ['define_new_head_3',
        'Эта операционная вершина владеет 2 важными параметрами:\n' +
        '1) следующая операционная вершина (ее сын) - вершина {1}.\n' +
        '2) целевая вершина - вершина {2} в главном графе.'],

    ['pop_node',
        'Таким образом, мы знаем как удалить \'голову\' из текущей версии.\n' +
        'Изменим указатели на голову и ведущую вершину операционного списка текущей версии на полученные ранее вершины.'],

    ['ended_popping',
        'Мы успешно удалили вершину из выбранной версии!'],
]);
let text_containers = new Map([
    ['en', text_container_en],
    ['ru', text_container_ru],
]);

let html_page_container = new Map([
    ['en', './locales/en.json'],
    ['ru', './locales/ru.json'],
]);
let instructions_container = new Map([
    ['ru',
        "<h1>Инструкция</h1>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Данный визуализатор представляет собой один из вариантов реализации структуры данных \"Персистентная очередь\".<br>\n" +
        "    Основная концепция алгоритма - построение на двух деревьях.<br>\n" +
        "    Одно из них представляет саму очередь, второе является вспомогательным для совершения различных операций над ней.<br>\n" +
        "    Перед началом работы настоятельно советуется прочитать техническое описание алгоритма, для понимания его составных частей.\n" +
        "</p>\n" +
        "<h2>1. Меню</h2>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Здесь можно изменить язык, просмотреть различные конфигурации и тд.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">1.1 Выбор конфигурации</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Существует набор готовых пресетов, которые пошагово показывают, как проходят различные процессы в особых случаях.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">1.2 Перестройка графа</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Если в процессе работы граф потерял структурированность (вершины перекрывают друг друга, надписи смешиваются), то эта опция повторно запустит перестройку графа.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">1.3 Сброс данных</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Сбросить всю существующую информацию и вернуться к состоянию на момент создания структуры.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">1.4 Создание случайного графа</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Создание случайного графа, набирающегося последовательными операциями Добавления к случайным Версиям.<br>\n" +
        "    Вы можете контролировать конечный размер графа (положительные числа), а также его характер создания (числа от 0 до 100):<br>\n" +
        "    Более низкие коэффициенты будут приводить к линейным построениям, с помощью добавления вершин к последней доступной Версии.<br>\n" +
        "    Высокие же будут создавать граф, стараясь менять целевую Версию на каждом шаге случайным образом.\n" +
        "</p>\n" +
        "<h2>2. Основной интерфейс</h2>\n" +
        "<h4 class=\"instruction_topic\">2.1 Строка Версий</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    В верхней части расположена строка с объектами Версий.<br>\n" +
        "    При наведении на нее будет выведена техническая информация.<br>\n" +
        "    При нажатии на Версию будут выделены соответствующая ей очередь, а также ее вспомогательные списки.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">2.2 Главный граф.</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    В левой части расположен основной граф - сама очередь.<br>\n" +
        "    При наведении на ее элементы будет выведена техническая информация.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">2.3 Вспомогательный граф</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Справа расположено дерево вспомогательных списков.<br>\n" +
        "    При наведении на его элементы будет выведена техническая информация.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">2.4 Добавление/Удаление вершин из очереди</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Чтобы добавить в конец или удалить первую вершину из определенной версии очереди, введите номер искомой версии в соответствующее поле и нажмите кнопку.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">2.5 Пошаговая визуализация</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Если вы хотите, чтобы весь процесс добавления/удаления происходил пошагово и наглядно - отметьте поле Пошаговая визуализация.\n" +
        "</p>"
    ],

    ['en',
        "<h1>Instruction</h1>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    This is the visualisator of one of possible algorithms for persistent queue structure realisation.<br>\n" +
        "    Algorithm's main concept - building two graphs.<br>\n" +
        "    One of them is actually the queue, the other - auxiliary one, for different operations on the queue.<br>\n" +
        "    Before startup it is strictly advised to fully acknowledge technical algorithm basics, for it's components understanding.\n" +
        "</p>\n" +
        "<h2>1. Menu Interface</h2>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    You can change language here, choose different configs, etc.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">1.1 Configs</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    There is a set of ready-to-go presets, which can show different situations of algorithm behaviour.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">1.2 Graph layout rebuild</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    If during the usage graphs are not well structured (nodes or labels are overlapping), this option will restart the graph building.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">1.3 Resetting environment</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    This option will delete all information and return to initial state.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">1.4 Random graph creation</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    Make new graph, built by continuous Add node operations to random Versions.<br>\n" +
        "    You can control final graph size (positive integers) and it's creation process (0-100 integers):<br>\n" +
        "    Lower coefficients will result in more continuous build via adding to the last available version.<br>\n" +
        "    Higher ones will tend to change targeted version number for push operation randomly on every step.\n" +
        "</p>\n" +
        "<h2>2. Main Interface</h2>\n" +
        "<h4 class=\"instruction_topic\">2.1 Versions</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    In the upper part are placed Versions objects.<br>\n" +
        "    On mouse hover they will display some technical information, which is stored in them.<br>\n" +
        "    If clicked, corresponding queue and it's auxiliary lists will be highlighted.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">2.2 Main graph</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    In the left side is placed main graph - the queue itself.<br>\n" +
        "    On mouse hover on nodes will be displayed some technical information which is stored in them.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">2.3 Auxiliary graph</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    In the right side is placed the auxiliary lists tree.<br>\n" +
        "    On mouse hover on nodes will be displayed some technical information which is stored in them.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">2.4 Adding/Deleting nodes from queue</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    In order to push node to the queue end or pop first one from the certain queue version, enter the desired version number in corresponding field.\n" +
        "</p>\n" +
        "<h4 class=\"instruction_topic\">2.5 Step-by-step visualization</h4>\n" +
        "<p class=\"instruction_paragraph\">\n" +
        "    If you want to watch internal processes of pushing/popping nodes step-by-step - check the 'Activate step-by-step' checkbox.\n" +
        "</p>"
    ]
]);

let configs = new Map([
    ['push_1', ConfigOrdinaryQueuePush],
    ['pop_1', ConfigOneElementedQueuePop],
    ['pop_2', ConfigTwoElementedQueuePop],
    ['pop_3', ConfigOrdinaryQueuePop],
    ['dyn_1', ConfigDynamicListCreation],
    ['dyn_2', ConfigAuxiliaryListsSwap],
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
    constructor(son_id = null, id = null, label = null, x = 0, y = 0) {
        this.son_id = son_id;
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

class Highlighters {
    constructor(main_nodes = null, main_links = null, dynamic_nodes = null, dynamic_links = null) {
        this.main_nodes = (main_nodes !== null) ? main_nodes : [];
        this.main_links = (main_links !== null) ? main_links : [];
        this.dynamic_nodes = (dynamic_nodes !== null) ? dynamic_nodes : [];
        this.dynamic_links = (dynamic_links !== null) ? dynamic_links : [];
    }

    main_nodes;
    dynamic_nodes;
    main_links;
    dynamic_links;

    AddMainNode(nodes, needs_rehighlighting = false) {
        for (let node of nodes) {
            this.main_nodes.push(node);
        }
        if (needs_rehighlighting) {
            this.ReHighlight();
        }
    }
    AddMainLink(links, needs_rehighlighting = false) {
        for (let link of links) {
            this.main_links.push(link);
        }
        if (needs_rehighlighting) {
            this.ReHighlight();
        }
    }
    AddDynamicNode(nodes, needs_rehighlighting = false) {
        for (let node of nodes) {
            this.dynamic_nodes.push(node);
        }
        if (needs_rehighlighting) {
            this.ReHighlight();
        }
    }
    AddDynamicLink(links, needs_rehighlighting = false) {
        for (let link of links) {
            this.dynamic_links.push(link);
        }
        if (needs_rehighlighting) {
            this.ReHighlight();
        }
    }
    ReHighlight() {
        let main = main_svg.select('g.nodes');
        for (let i = 0; i < _nodes.length; ++i) {
            let target = main.select("[id='" + i + "']").node();
            target.classList.remove('blink_node');
        }
        let dynamic = sec_svg.select('g.nodes');
        for (let i = 0; i < _dynamic_nodes.length; ++i) {
            let target = dynamic.select("[id='" + i + "']").node();
            target.classList.remove('blink_node');
        }
        main = main_svg.select('g.links');
        for (let i = 0; i < _links.length; ++i) {
            let target = main.select("[id='" + i + "']").node();
            target.classList.remove('blink_link');
        }
        dynamic = sec_svg.select('g.links');
        for (let i = 0; i < _dynamic_links.length; ++i) {
            let target = dynamic.select("[id='" + i + "']").node();
            target.classList.remove('blink_link');
        }


        main = main_svg.select('g.nodes');
        for (let node of this.main_nodes) {
            let target = main.select("[id='" + node + "']").node();
            target.classList.add('blink_node');
        }
        dynamic = sec_svg.select('g.nodes');
        for (let node of this.dynamic_nodes) {
            let target = dynamic.select("[id='" + node + "']").node();
            target.classList.add('blink_node');
        }
        main = main_svg.select('g.links');
        for (let link of this.main_links) {
            let target = main.select("[id='" + link + "']").node();
            target.classList.add('blink_link');
        }
        dynamic = sec_svg.select('g.links');
        for (let link of this.dynamic_links) {
            let target = dynamic.select("[id='" + link + "']").node();
            target.classList.add('blink_link');
        }
    }
    Clear(needs_rehighlighting = true) {
        this.main_nodes = [];
        this.dynamic_nodes = [];
        this.main_links = [];
        this.dynamic_links = [];
        if (needs_rehighlighting) {
            this.ReHighlight();
        }
    }
}

class State {
    constructor(args, function_call, old_sizes, highlighters) {
        this.main_node = (_nodes.length !== old_sizes[0]) ? Object.assign({}, _nodes.at(-1)) : null;
        this.main_link = (_links.length !== old_sizes[1]) ? Object.assign({}, _links.at(-1)) : null;
        this.dynamic_node = (_dynamic_nodes.length !== old_sizes[2]) ? Object.assign({}, _dynamic_nodes.at(-1)) : null;
        this.dynamic_link = (_dynamic_links.length !== old_sizes[3]) ? Object.assign({}, _dynamic_links.at(-1)) : null;
        this.version = (_versions.length !== old_sizes[4]) ? Object.assign({}, _versions.at(-1)) : null;

        this.highlighters = JSON.parse(JSON.stringify(highlighters));
        this.chosen_version = chosen_version;
        this.is_first_swap = is_first_swap;
        this.overall_id = overall_id;

        this.args = JSON.parse(JSON.stringify(args));
        this.function_call = function_call;
    }

    main_node = null;
    main_link = null;
    version = null;
    dynamic_node = null;
    dynamic_link = null;

    highlighters;
    chosen_version;
    is_first_swap;
    overall_id;

    args;
    function_call;

    RestoreState(old_sizes) {
        if (_nodes.length !== old_sizes[0] && this.main_node === null) {
            _nodes.pop();
        }
        if (_links.length !== old_sizes[1] && this.main_link === null) {
            _links.pop();
        }
        if (_dynamic_nodes.length !== old_sizes[2] && this.dynamic_node === null) {
            _dynamic_nodes.pop();
        }
        if (_dynamic_links.length !== old_sizes[3] && this.dynamic_link === null) {
            _dynamic_links.pop();
        }
        if (_versions.length !== old_sizes[4] && this.version === null) {
            _versions.pop();
        }
        if (this.main_node !== null) {
            _nodes[_nodes.length - 1] = Object.assign({}, this.main_node);
        }
        if (this.main_link !== null) {
            _links[_links.length - 1] = CopyLink(this.main_link);
        }
        if (this.dynamic_node !== null) {
            _dynamic_nodes[_dynamic_nodes.length - 1] = Object.assign({}, this.dynamic_node);
        }
        if (this.dynamic_link !== null) {
            _dynamic_links[_dynamic_links.length - 1] = CopyLink(this.dynamic_link);
        }
        if (this.version !== null) {
            _versions[_versions.length - 1] = Object.assign({}, this.version);
        }



        chosen_version = this.chosen_version;
        is_first_swap = this.is_first_swap;
        overall_id = this.overall_id;
        let new_highlighter = new Highlighters(this.highlighters.main_nodes, this.highlighters.main_links, this.highlighters.dynamic_nodes, this.highlighters.dynamic_links);
        return [this.args, this.function_call, new_highlighter];
    }
}

async function Push(parent_version_num = -1) {
    console.log('Push called.');
    if (parent_version_num < 0) {
        let form = document.getElementById('push_form');
        parent_version_num = form.push_version.value;
        form.reset();
    }
    parent_version_num = ValidateInputVersion(parent_version_num);
    if (parent_version_num < 0) {
        return;
    }
    if (step_by_step_is_active) {
        is_push = true;
        await OperationsCoordinator(parent_version_num);
    } else {
        TurnOffVersionHighlighting();
        await Push__NoStepping(parent_version_num);
    }
    console.log('Push made successfully');
}
async function Pop(parent_version_num = -1) {
    console.log('Pop called.');
    if (parent_version_num < 0) {
        let form = document.getElementById('pop_form');
        parent_version_num = form.pop_version.value;
        form.reset();
    }
    parent_version_num = ValidateInputVersion(parent_version_num);
    if (parent_version_num < 0) {
        return;
    }
    let parent_version = _versions[parent_version_num];
    if (parent_version.head === 0) {
        console.warn(`Can't pop from empty version`);
        return;
    }
    if (step_by_step_is_active) {
        is_push = false;
        await OperationsCoordinator(parent_version_num);
    } else {
        TurnOffVersionHighlighting();
        await Pop__NoStepping(parent_version_num);
    }
    console.log('Pop made successfully');

}
function ValidateInputVersion(version_num) {
    if (version_num === 'b') {
        HideAll();
        return -1;
    }
    if (!isNum(version_num)) {
        console.warn('Invalid input format.');
        return -1;
    }
    version_num = Number(version_num);
    if (version_num >= _versions.length) {
        console.warn('Invalid version number.');
        return -1;
    }
    return version_num;
}

async function Push__NoStepping(parent_version_num) {
    StopUpdatingLayout();

    let parent_version = _versions[parent_version_num];

    let x_coord = _nodes[parent_version.tail].x - 30 - GetRandomInt(5);
    let y_coord = _nodes[parent_version.tail].y - 30 - GetRandomInt(5);
    _nodes.push(new Node(parent_version.tail, _nodes.length, overall_id++, x_coord, y_coord));
    let new_node = _nodes.length - 1;


    _links.push(new Link(_links.length, new_node, _nodes[new_node].son_id));


    x_coord = _versions.at(-1).x + 35;
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

    let version = _versions[parent_version_num];
    let x_coord = _versions.at(-1).x + 35;
    let y_coord = _versions.at(-1).y;
    ++overall_id;

    if (version.size === 1) {
        _versions.push(new Version(0, 0, null, null, 0, 0, 0, _versions.length, _versions.length, parent_version_num, x_coord, y_coord));

        UpdateVersionsLayout();
        return;
    }

    if (version.size === 2) {
        _versions.push(new Version(version.tail, version.tail, null, null, 1, 0, 0, _versions.length, _versions.length, parent_version_num, x_coord, y_coord));

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
    let dynamic_list = version.dynamic_list;
    if (dynamic_list !== null && _nodes[_dynamic_nodes[dynamic_list].target_node].son_id === version.head) {
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
    if (version.operational_list_size * 2 >= curr_version_nodes_size || await ListsExchange__NoStepping(version)) {
        return;
    }

    let targeted_main_node = (version.dynamic_list !== null) ? _nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id : _nodes[version.tail].son_id;
    let next_list = (version.dynamic_list !== null) ? version.dynamic_list : 0;
    let x_coord = _dynamic_nodes[next_list].x - 30 - GetRandomInt(5);
    let y_coord = _dynamic_nodes[next_list].y - 30 - GetRandomInt(5);
    _dynamic_nodes.push(new ListNode(next_list, targeted_main_node, _dynamic_nodes.length, targeted_main_node, x_coord, y_coord));

    _dynamic_links.push(new Link(_dynamic_links.length, _dynamic_nodes.length - 1, next_list));

    version.dynamic_list = _dynamic_nodes.length - 1;
    ++version.dynamic_list_size;

    await ListsExchange__NoStepping(version);
}

async function OperationsCoordinator(parent_version_num) {
    StopUpdatingLayout();
    PrepareStepByStepLayout();

    is_first_swap = true;
    let next_function_call;
    next_function_call = (is_push) ? PreparePush : PreparePop;
    let states = [];
    highlighters = new Highlighters();
    let args = [parent_version_num];
    let old_size = [_nodes.length, _links.length, _dynamic_nodes.length, _dynamic_links.length, _versions.length];

    let index = -2;
    let action = '';
    while (next_function_call !== 'End') {
        states[index + 2] = new State(args, next_function_call, old_size, highlighters);
        console.log('Saving state before f_call', next_function_call);
        ++index;
        [next_function_call, args] = await next_function_call(args);
        HighlightVersion(chosen_version);
        console.log('Next call', next_function_call, args);
        action = await WaitForNextAction();
        if (action === 'break_out') {
            ReturnFromStepByStepLayout();
            observer.stop = true;
            return;
        }
        while (action === "prev") {
            if (index < 0) {
                action = await WaitForNextAction();
                if (action === 'break_out') {
                    ReturnFromStepByStepLayout();
                    observer.stop = true;
                    return;
                }
            } else {
                console.warn('Getting previous state', states[index]);
                [args, next_function_call, highlighters] = states[index].RestoreState(old_size);
                console.log('Restored state before calling', next_function_call);
                index -= 2;
                highlighters.ReHighlight();
                await UpdateLayout__NoPhysics();
                break;
            }
        }
    }

    ReturnFromStepByStepLayout();
    await UpdateLayout();
}

async function PreparePush([parent_version_num]) {
    GetNextStepText('click_on_old_version_push', parent_version_num);
    HighlightVersion(parent_version_num);
    return [CopyOldVersion, [parent_version_num]];
}
async function CopyOldVersion([parent_version_num]) {
    let parent_version = _versions[parent_version_num];

    let x_coord = _versions.at(-1).x + 35;
    let y_coord = _versions.at(-1).y;

    let first_el = parent_version.head;
    let last_el = parent_version.tail;
    let operational_list = parent_version.operational_list;
    let dynamic_list = parent_version.dynamic_list;
    let size = parent_version.size;
    let operational_list_size = parent_version.operational_list_size;
    let dynamic_list_size = parent_version.dynamic_list_size;
    _versions.push(new Version(first_el, last_el, operational_list, dynamic_list, size, operational_list_size, dynamic_list_size, _versions.length, _versions.length, parent_version_num, x_coord, y_coord));

    GetNextStepText('copy_old_version');
    await UpdateVersionsLayout__NoPhysics();

    if (is_push) {
        return [DefineTailNodeToLink, [parent_version_num]];
    }
    return [DefineNodeToPop, [parent_version_num]];
}
async function DefineTailNodeToLink([parent_version_num]) {
    let parent_version = _versions[parent_version_num];
    let son = parent_version.tail;
    highlighters.AddMainNode([son], true);
    GetNextStepText('define_tail_node_to_link', _nodes[son].label);
    return [LinkNewMainNode, [parent_version_num]];
}
async function LinkNewMainNode([parent_version_num]) {
    let parent_version = _versions[parent_version_num];
    let x_coord = _nodes[parent_version.tail].x - 30 - GetRandomInt(5);
    let y_coord = _nodes[parent_version.tail].y - 30 - GetRandomInt(5);
    _nodes.push(new Node(parent_version.tail, _nodes.length, overall_id++, x_coord, y_coord));
    let new_node = _nodes.length - 1;

    _links.push(new Link(_links.length, new_node, _nodes[new_node].son_id));

    let version = _versions.at(-1);
    version.head = parent_version.head !== 0 ? parent_version.head : new_node;
    version.tail = new_node;
    version.size = parent_version.size + 1;

    await UpdateMainLayout__NoPhysics();

    highlighters.Clear(false);
    highlighters.AddMainNode([new_node]);
    highlighters.AddMainLink([_links.length - 1], true);
    HighlightVersion(_versions.length - 1);
    GetNextStepText('push_new_node', _nodes[new_node].label);
    return [DynamicListExistence, []];
}

async function DynamicListExistence() {
    highlighters.Clear();
    let version = _versions.at(-1);

    if (version.dynamic_list !== null) {
        GetNextStepText('dynamic_list_exists');
        return [TrySwappingLists, []];
    }
    GetNextStepText('dynamic_list_absent');
    return [CheckDynamicListCriteria, []];
}
async function CheckDynamicListCriteria(){
    let version = _versions.at(-1);
    let untracked_nodes_amount = Math.max(0, version.size - 2);
    if (version.operational_list_size * 2 >= untracked_nodes_amount) {
        GetNextStepText('criteria_not_fulfilled', version.operational_list_size, untracked_nodes_amount);
        if (is_push) {
            return [EndPushing, []];
        }
        return [EndPopping, []];
    }
    GetNextStepText('criteria_fulfilled', version.operational_list_size, untracked_nodes_amount);
    return [TargetedNodeDefiningNull1, []];
}
async function TargetedNodeDefiningNull1() {
    let version = _versions.at(-1);

    let tail = version.tail;
    highlighters.AddMainNode([tail], true);
    GetNextStepText('define_targeted_node_null', _nodes[tail].label);
    return [TargetedNodeDefiningNull2, []];
}
async function TargetedNodeDefiningNull2() {
    let version = _versions.at(-1);

    let tail = version.tail;
    let new_targeted_main_node = _nodes[version.tail].son_id;
    highlighters.Clear(false);
    highlighters.AddMainNode([new_targeted_main_node], true);
    GetNextStepText('define_targeted_node_null2', _nodes[tail].label, _nodes[new_targeted_main_node].label);
    return [NewDynamicNodeCreation, [new_targeted_main_node]];
}

async function TrySwappingLists() {
    highlighters.Clear();
    let version = _versions.at(-1);

    let dynamic_list = version.dynamic_list;
    highlighters.AddDynamicNode([dynamic_list], true);
    GetNextStepText('get_leading_dynamic_node', _dynamic_nodes[dynamic_list].label);
    return [CheckIfReachedHead1, []];
}
async function CheckIfReachedHead1() {
    let version = _versions.at(-1);

    let dynamic_list = version.dynamic_list;
    let targeted_node = _dynamic_nodes[dynamic_list].target_node;
    highlighters.Clear(false);
    highlighters.AddMainNode([targeted_node], true);
    GetNextStepText('get_targeted_main_node', _dynamic_nodes[dynamic_list].label, _nodes[targeted_node].label);
    return [CheckIfReachedHead2, []];
}
async function CheckIfReachedHead2() {
    let version = _versions.at(-1);

    let dynamic_list = version.dynamic_list;
    let targeted_node = _dynamic_nodes[dynamic_list].target_node;
    let targeted_node_son = _nodes[targeted_node].son_id;
    highlighters.Clear(false);
    highlighters.AddMainNode([targeted_node_son], true);
    GetNextStepText('get_targeted_node_son', _dynamic_nodes[dynamic_list].label, _nodes[targeted_node].label, _nodes[targeted_node_son].label);
    return [ConfirmListsSwap, []];
}
async function ConfirmListsSwap() {
    highlighters.Clear();
    let version = _versions.at(-1);
    let head = version.head;
    if (_nodes[_dynamic_nodes[version.dynamic_list].target_node].son_id === head) {
        version.operational_list = version.dynamic_list;
        version.operational_list_size = version.dynamic_list_size;
        version.dynamic_list = null;
        version.dynamic_list_size = 0;

        GetNextStepText('reached_head_swap_confirmed', _nodes[head].label);
        HighlightVersion(_versions.length - 1);
        if (is_first_swap) {
            return [FirstSwapSuccess, []];
        }
        if (is_push) {
            return [EndPushing, []];
        }
        return [EndPopping, []];
    }
    if (is_first_swap) {
        GetNextStepText('first_swap_failed', _nodes[head].label);
        return [TargetedNodeDefining, []];
    }
    GetNextStepText('second_swap_failed', _nodes[head].label);
    if (is_push) {
        return [EndPushing, []];
    }
    return [EndPopping, []];
}
async function FirstSwapSuccess() {
    GetNextStepText('swap_success');
    if (is_push) {
        return [EndPushing, []];
    }
    return [EndPopping, []];
}

async function TargetedNodeDefining() {
    let version = _versions.at(-1);

    let dynamic_node = version.dynamic_list;
    let targeted_node = _dynamic_nodes[dynamic_node].target_node;
    let new_targeted_main_node = _nodes[targeted_node].son_id;
    highlighters.Clear(false);
    highlighters.AddMainNode([new_targeted_main_node], true);
    GetNextStepText('define_targeted_node', _nodes[new_targeted_main_node].label);
    return [NewDynamicNodeCreation, [new_targeted_main_node]];
}
async function NewDynamicNodeCreation([targeted_main_node]) {
    let version = _versions.at(-1);

    let next_list = (version.dynamic_list !== null) ? version.dynamic_list : 0;
    let x_coord = _dynamic_nodes[next_list].x - 30 - GetRandomInt(5);
    let y_coord = _dynamic_nodes[next_list].y - 30 - GetRandomInt(5);
    _dynamic_nodes.push(new ListNode(next_list, targeted_main_node, _dynamic_nodes.length, targeted_main_node, x_coord, y_coord));

    let son_id = (version.dynamic_list !== null) ? version.dynamic_list : 0;
    _dynamic_links.push(new Link(_dynamic_links.length, _dynamic_nodes.length - 1, son_id));

    if (version.dynamic_list !== null) {
        GetNextStepText('add_new_dynamic_node_1');
    } else {
        GetNextStepText('add_new_dynamic_node_2');
    }

    version.dynamic_list = _dynamic_nodes.length - 1;
    ++version.dynamic_list_size;

    await UpdateSecondaryLayout__NoPhysics();
    HighlightVersion(_versions.length - 1);
    highlighters.Clear(false);
    highlighters.AddDynamicNode([_dynamic_nodes.length - 1]);
    highlighters.AddDynamicLink([_dynamic_links.length - 1], true);

    return [TrySwappingListsAgain, []];
}
async function TrySwappingListsAgain() {
    highlighters.Clear();
    is_first_swap = false;
    GetNextStepText('try_swap_again');
    return [TrySwappingLists, []];
}
async function EndPushing() {
    GetNextStepText('ended_pushing');
    return ['End', []];
}

async function PreparePop([parent_version_num]) {
    GetNextStepText('click_on_old_version_pop', parent_version_num);
    HighlightVersion(parent_version_num);
    return [CopyOldVersion, [parent_version_num]];
}
async function DefineNodeToPop([parent_version_num]) {
    let parent_version = _versions[parent_version_num];
    let head = parent_version.head;
    highlighters.AddMainNode([head], true);
    GetNextStepText('define_node_to_pop', _nodes[head].label);
    ++overall_id;
    if (parent_version.size === 1) {
        return [QueueSizeIs1, []];
    }
    if (parent_version.size === 2) {
        return [QueueSizeIs2, []];
    }
    return [DefineNewHead, [parent_version_num]];
}
async function QueueSizeIs1() {
    let version = _versions.at(-1);
    version.head = 0;
    version.tail = 0;
    version.size = 0;
    highlighters.Clear();
    HighlightVersion(_versions.length - 1);
    GetNextStepText('pop_node_list_size_1');
    return [EndPopping, []];
}
async function QueueSizeIs2() {
    let version = _versions.at(-1);
    version.head = version.tail;
    version.size = 1;
    highlighters.Clear();
    HighlightVersion(_versions.length - 1);
    GetNextStepText('pop_node_list_size_2');
    return [EndPopping, []];
}
async function DefineNewHead([parent_version_num]) {
    let parent_version = _versions[parent_version_num];

    let operational_node = parent_version.operational_list;
    highlighters.Clear(false);
    highlighters.AddDynamicNode([operational_node], true);
    GetNextStepText('define_new_head_1', _dynamic_nodes[operational_node].label);
    return [DefineNewHead2, [parent_version_num]];
}
async function DefineNewHead2([parent_version_num]) {
    let parent_version = _versions[parent_version_num];

    let operational_node = parent_version.operational_list;
    let next_operational_list = _dynamic_nodes[operational_node].next_list;

    highlighters.Clear(false);
    highlighters.AddDynamicNode([next_operational_list], true);
    GetNextStepText('define_new_head_2', _dynamic_nodes[next_operational_list].label);
    return [DefineNewHead3, [parent_version_num]];
}
async function DefineNewHead3([parent_version_num]) {
    let parent_version = _versions[parent_version_num];

    let operational_node = parent_version.operational_list;
    let next_operational_list = _dynamic_nodes[operational_node].next_list;
    let new_head = _dynamic_nodes[operational_node].target_node;

    highlighters.Clear(false);
    highlighters.AddMainNode([new_head], true);

    GetNextStepText('define_new_head_3', _dynamic_nodes[next_operational_list].label, _nodes[new_head].label);
    return [ShowNewVersion, [parent_version_num]];
}
async function ShowNewVersion([parent_version_num]) {
    let parent_version = _versions[parent_version_num];
    let version = _versions.at(-1);
    version.head = _dynamic_nodes[parent_version.operational_list].target_node;
    version.operational_list = _dynamic_nodes[parent_version.operational_list].next_list;
    version.size = parent_version.size - 1;
    version.operational_list_size = parent_version.operational_list_size - 1;
    GetNextStepText('pop_node');
    highlighters.Clear(false);
    highlighters.AddMainNode([version.head]);
    highlighters.AddDynamicNode([version.operational_list], true);
    HighlightVersion(_versions.length - 1);
    return [DynamicListExistence, []];
}
async function EndPopping() {
    GetNextStepText('ended_popping');
    return ['End', []];
}



async function ConfigOrdinaryQueuePush() {
    simulation_time = 1;
    await Push__NoStepping(0);
    await Push__NoStepping(1);
    await Push__NoStepping(2);
    await Push__NoStepping(3);
    simulation_time = 500;
    await Push__NoStepping(4);
    simulation_time = 3000;
    await Push(5);
}
async function ConfigOneElementedQueuePop() {
    simulation_time = 500;
    await Push__NoStepping(0);
    simulation_time = 3000;
    await Pop(1);
}
async function ConfigTwoElementedQueuePop() {
    simulation_time = 1;
    await Push__NoStepping(0);
    simulation_time = 500;
    await Push__NoStepping(1);
    simulation_time = 3000;
    await Pop(2);
}
async function ConfigOrdinaryQueuePop() {
    simulation_time = 1;
    await Push__NoStepping(0);
    await Push__NoStepping(1);
    await Push__NoStepping(2);
    await Push__NoStepping(3);
    await Push__NoStepping(4);
    simulation_time = 500;
    await Push__NoStepping(5);
    simulation_time = 3000;
    await Pop(6);
}
async function ConfigDynamicListCreation() {
    simulation_time = 1;
    await Push__NoStepping(0);
    await Push__NoStepping(1);
    await Push__NoStepping(2);
    simulation_time = 500;
    await Push__NoStepping(3);
    simulation_time = 3000;
    await Push(4);
}
async function ConfigAuxiliaryListsSwap() {
    simulation_time = 1;
    await Push__NoStepping(0);
    await Push__NoStepping(1);
    await Push__NoStepping(2);
    await Push__NoStepping(3);
    await Push__NoStepping(4);
    simulation_time = 500;
    await Push__NoStepping(5);
    simulation_time = 3000;
    await Push(6);
}

async function RandomGraphParamsSubmit() {
    let form = document.getElementById('random_size_form');
    let size = form.random_size.value;
    form.reset();
    form = document.getElementById('random_coeff_form');
    let coeff = form.random_coeff.value;
    form.reset();
    if (!isNum(size) || !isNum(coeff) || coeff < 0 || coeff > 100) {
        return;
    }
    RandomGraphParamsToggler();
    console.log('create graph. size:', size, 'coeff:', coeff);
    await RandomGraph(size, coeff);
}
async function RandomGraph(size, change_coeff = 0) {
    await ResetEnvironment();
    simulation_time = 1;
    let max_version = 0;
    for (let iter = 0; iter < size - 1; ++iter) {
        let version;
        if (change_coeff > GetRandomInt(100)) {
            version = GetRandomInt(max_version);
        } else {
            version = max_version;
        }
        ++max_version;
        await Push__NoStepping(version);
    }
    simulation_time = 7000;
    await Push__NoStepping(max_version);
    simulation_time = 3000;
}

async function AwaitFor(observer, value) {
    while (observer.stop !== value) {
        await sleep(1);
    }
    console.warn('change');
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
function TargetNodeCircumferencePoint(d) {
    let t_radius = 20; // custom number, for arrows on links be pointed exactly on node
    let dx = d.target.x - d.source.x;
    let dy = d.target.y - d.source.y;
    let gamma = Math.atan2(dy, dx);
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
        element.style.display = 'none';
    }
    let banan = document.getElementById('banan');
    banan.style.display = 'block';
}

async function WaitForNextAction() {
    while (!next_step_required && !previous_step_required && !break_out) {
        await sleep(10);
    }
    if (break_out) {
        break_out = false;
        return 'break_out';
    }
    if (next_step_required) {
        next_step_required = false;
        return 'next';
    }
    previous_step_required = false;
    return 'prev';
}
function NextStep() {
    next_step_required = (step_by_step_is_active) ? true : next_step_required;
}
function PreviousStep() {
    previous_step_required = (step_by_step_is_active) ? true : previous_step_required;
}

function PrepareStepByStepLayout() {
    document.getElementById('push_form').hidden = true;
    document.getElementById('pop_form').hidden = true;
    // document.getElementById('debug_button').hidden = true;
    document.getElementById('step_by_step_container').classList.add('hide');
    document.getElementById('update_layout_button').hidden = true;
    document.getElementById('next_step_button').hidden = false;
    document.getElementById('previous_step_button').hidden = false;
    document.getElementById('help_text_container').hidden = false;
}
function ReturnFromStepByStepLayout() {
    document.getElementById('push_form').hidden = false;
    document.getElementById('pop_form').hidden = false;
    // document.getElementById('debug_button').hidden = false;
    document.getElementById('step_by_step_container').classList.remove('hide');
    document.getElementById('update_layout_button').hidden = false;
    document.getElementById('next_step_button').hidden = true;
    document.getElementById('previous_step_button').hidden = true;
    document.getElementById('help_text_container').hidden = true;
}

function SetupVersionSVG() {
    ver_svg = d3.select('#versions_svg');

    ver_svg.append('g')
        .attr('id', 'ver_links')
        .attr('class', 'links');

    ver_svg.append('g')
        .attr('id', 'ver_nodes')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(_versions)
        .enter().append('circle')
        .attr('r', 10)
        .attr('class', 'version_node')
        .attr('id', node => node.id)
        .on('click', VersionClick)
        .on('mouseover', PopupMouseOverVersionNode)
        .on('mouseout', PopupMouseOutVersionNode);

    ver_svg.append('g')
        .attr('id', 'ver_texts')
        .attr('class', 'texts')
        .selectAll('text')
        .data(_versions)
        .enter().append('text')
        .text(node => node.label)
        .attr('class', 'version_text')
        .attr('dx', 7)
        .attr('dy', 20);

    ver_sim = d3
        .forceSimulation();

    MakeMovableVersions();
}
function MakeMovableVersions() {
    let nodeElements = ver_svg.select('g.nodes').selectAll('circle');
    let textElements = ver_svg.select('g.texts').selectAll('text');

    ver_sim.nodes(_versions).on('tick', () => {
        nodeElements
            .attr('cx', node => node.x)
            .attr('cy', node => node.y);
        textElements
            .attr('x', node => node.x)
            .attr('y', node => node.y);
    });
}
function UpdateVersionsLayout() {
    let g_nodes = ver_svg
        .select('g.nodes')
        .selectAll('circle')
        .data(_versions, d => d.id);
    g_nodes
        .exit()
        .remove();
    g_nodes
        .enter()
        .append('circle')
        .attr('r', 10)
        .attr('class', 'version_node')
        .attr('id', node => node.id)
        .on('click', VersionClick)
        .on('mouseover', PopupMouseOverVersionNode)
        .on('mouseout', PopupMouseOutVersionNode);

    let g_texts = ver_svg
        .select('g.texts')
        .selectAll('text')
        .data(_versions, d => d.id);
    g_texts
        .exit()
        .remove();
    g_texts
        .enter()
        .append('text')
        .text(node => node.label)
        .attr('class', 'version_text')
        .attr('dx', 7)
        .attr('dy', 25);

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

    main_linkForce = d3
        .forceLink()
        .id(link => link.id)
        .strength(link => link.strength);

    let main = document.getElementById('main_svg').getBoundingClientRect();
    let main_width = main.width;
    let main_height = main.height;

    main_sim = d3
        .forceSimulation()
        .force('link', main_linkForce)
        .force('charge', d3.forceManyBody().strength(-50))
        .force('center', d3.forceCenter(main_width / 2, main_height / 2));

    main_svg.append('g')
        .attr('id', 'main_links')
        .attr('class', 'links');

    main_svg.append('g')
        .attr('id', 'main_nodes')
        .attr('class', 'nodes');

    main_svg.append('g')
        .attr('id', 'main_texts')
        .attr('class', 'texts');

    main_zoom = d3.zoom()
        .scaleExtent([0.2, 5])
        // .translateExtent([[0, 0], [width, height]])
        .on('zoom', HandleZoom);
    d3.select('#main_svg')
        .call(main_zoom);


    MakeMovableMain();

    main_sim.force('link').links(_links);
}
function MakeMovableMain() {
    let linkElements = main_svg.select('g.links').selectAll('line');
    let nodeElements = main_svg.select('g.nodes').selectAll('circle');
    let textElements = main_svg.select('g.texts').selectAll('text');

    main_sim.nodes(_nodes).on('tick', () => {
        nodeElements
            .attr('cx', node => node.x)
            .attr('cy', node => node.y);
        textElements
            .attr('x', node => node.x)
            .attr('y', node => node.y);
        linkElements
            .attr('x1', link => link.source.x)
            .attr('y1', link => link.source.y)
            .attr("x2", function (d) {
                return TargetNodeCircumferencePoint(d)[0];
            })
            .attr("y2", function (d) {
                return TargetNodeCircumferencePoint(d)[1];
            });
    });
}
function UpdateMainLayout() {
    let g_links = main_svg
        .select('g.links')
        .selectAll('line')
        .data(_links, d => d.id);
    g_links
        .exit()
        .remove();
    g_links
        .enter()
        .append('line')
        .attr('class', 'arrow_link')
        .attr('id', link => link.id);

    let g_nodes = main_svg
        .select('g.nodes')
        .selectAll('circle')
        .data(_nodes, d => d.id);
    g_nodes
        .exit()
        .remove();
    g_nodes
        .enter()
        .append('circle')
        .attr('r', 10)
        .attr('class', 'regular_node')
        .attr('id', node => node.id)
        .on('mouseover', PopupMouseOverMainNode)
        .on('mouseout', PopupMouseOutMainNode);

    let g_texts = main_svg
        .select('g.texts')
        .selectAll('text')
        .data(_nodes, d => d.id);
    g_texts
        .exit()
        .remove();
    g_texts
        .enter()
        .append('text')
        .text(node => node.label)
        .attr('class', 'graph_text')
        .attr('id', node => node.id)
        .attr('dx', 7)
        .attr('dy', -10);

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

    sec_linkForce = d3
        .forceLink()
        .id(link => link.id)
        .strength(link => link.strength);

    let sec = document.getElementById('secondary_svg').getBoundingClientRect();
    let sec_width = sec.width;
    let sec_height = sec.height;

    sec_sim = d3
        .forceSimulation()
        .force('link', sec_linkForce)
        .force('charge', d3.forceManyBody().strength(-50))
        .force('center', d3.forceCenter(sec_width / 2, sec_height / 2));

    sec_svg
        .append('g')
        .attr('id', 'sec_links')
        .attr('class', 'links');

    sec_svg
        .append('g')
        .attr('id', 'sec_nodes')
        .attr('class', 'nodes');

    sec_svg.append('g')
        .attr('id', 'sec_texts')
        .attr('class', 'texts');

    sec_zoom = d3.zoom()
        .scaleExtent([0.2, 5])
        // .translateExtent([[0, 0], [width, height]])
        .on('zoom', HandleZoom);
    d3.select('#secondary_svg')
        .call(sec_zoom);

    MakeMovableSecondary();

    sec_sim.force('link').links(_dynamic_links);
}
function MakeMovableSecondary() {
    let linkElements = sec_svg.select('g.links').selectAll('line');
    let nodeElements = sec_svg.select('g.nodes').selectAll('circle');
    let textElements = sec_svg.select('g.texts').selectAll('text');

    sec_sim.nodes(_dynamic_nodes).on('tick', () => {
        nodeElements
            .attr('cx', node => node.x)
            .attr('cy', node => node.y);
        textElements
            .attr('x', node => node.x)
            .attr('y', node => node.y);
        linkElements
            .attr('x1', link => link.source.x)
            .attr('y1', link => link.source.y)
            .attr('x2', function (d) {
                return TargetNodeCircumferencePoint(d)[0];
            })
            .attr('y2', function (d) {
                return TargetNodeCircumferencePoint(d)[1];
            });
    });
}
function UpdateSecondaryLayout() {
    let g_links = sec_svg
        .select('g.links')
        .selectAll('line')
        .data(_dynamic_links, d => d.id);
    g_links
        .exit()
        .remove();
    g_links
        .enter()
        .append('line')
        .attr('class', 'arrow_link')
        .attr('id', link => link.id);

    let g_nodes = sec_svg
        .select('g.nodes')
        .selectAll('circle')
        .data(_dynamic_nodes, d => d.id);
    g_nodes
        .exit()
        .remove();
    g_nodes
        .enter()
        .append('circle')
        .attr('r', 10)
        .attr('class', 'regular_node')
        .attr('id', node => node.id)
        .on('mouseover', PopupMouseOverDynamicNode)
        .on('mouseout', PopupMouseOutDynamicNode);

    let g_texts = sec_svg
        .select('g.texts')
        .selectAll('text')
        .data(_dynamic_nodes, d => d.id);
    g_texts
        .exit()
        .remove();
    g_texts
        .enter()
        .append('text')
        .text(node => node.label)
        .attr('class', 'graph_text')
        .attr('id', node => node.id)
        .attr('dx', 7)
        .attr('dy', -10);

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

async function UpdateLayout() {
    is_updating_layout = true;
    UpdateVersionsLayout();
    UpdateMainLayout();
    UpdateSecondaryLayout();
    await sleep(simulation_time);
    StopUpdatingLayout();
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
    await UpdateVersionsLayout__NoPhysics();
    await UpdateMainLayout__NoPhysics();
    await UpdateSecondaryLayout__NoPhysics();
}

async function Setup() {
    await BindLocaleSwitcher();
    BindStepByStepToggler();
    BindConfigurationSwitcher();

    SetupVersionSVG();
    SetupMainSVG();
    SetupSecondarySVG();

    _versions.push(new Version(0, 0, null, null, 0, 0, 0, 0, '0', null, 25, 25));
    _nodes.push(new Node(null, 0, 'Null', 40, 40));
    _dynamic_nodes.push(new ListNode(null, null, 0, 'Null', 40, 40));

    await UpdateLayout();
    StopUpdatingLayout();
}
async function BindLocaleSwitcher() {
    let switcher = document.querySelector('[id=locale_switcher]');
    switcher.onchange = async (event) => {
        await SetLocale(event.target.value);
    };
    let event = {target: {value: 'en'}};
    await switcher.onchange(event);
}
async function SetLocale(new_locale) {
    if (new_locale === chosen_locale) {
        return;
    }
    chosen_locale = new_locale;

    let path = html_page_container.get(chosen_locale);
    let response = await fetch(path);
    let translation = await response.json();

    document.title = translation['title'];

    translation = translation.body;
    for (let id in translation) {
        let element = document.getElementById(id);
        if (element === null) {
            console.warn("Unknown element in translation");
            continue;
        }
        console.log(id, translation[id]);
        element.innerHTML = translation[id];
    }

    document.getElementById('instruction_text').innerHTML = instructions_container.get(new_locale)
}
function BindStepByStepToggler() {
    let switcher = document.querySelector('[id=step_by_step_toggle_checkbox]');
    switcher.onchange = (event) => {
        step_by_step_is_active = !step_by_step_is_active;
    };
}
function BindConfigurationSwitcher() {
    let switcher = document.querySelector('[id=configuration_switcher]');
    switcher.onchange = async (event) => {
        CloseSideBar();
        await SetConfiguration(event.target.value);
    };
}
async function SetConfiguration(config_to_set) {
    if (config_to_set === 'none') {
        return;
    }
    chosen_config = config_to_set;
    await ResetEnvironment();
    step_by_step_is_active = true;

    await configs.get(config_to_set)();

    step_by_step_is_active = false
}
async function ResetEnvironment() {
    if (step_by_step_is_active) {
        observer.stop = false;
        break_out = true;
        await AwaitFor(observer, true);
    }
    observer.stop = false;
    TurnOffVersionHighlighting();
    await AwaitFor(observer, true);
    _nodes = [];
    _links = [];
    _dynamic_nodes = [];
    _dynamic_links = [];
    _versions = [];
    overall_id = 1;
    chosen_version = -1;

    SetupVersionSVG();
    SetupMainSVG();
    SetupSecondarySVG();

    _versions.push(new Version(0, 0, null, null, 0, 0, 0, 0, '0', null, 25, 25));
    _nodes.push(new Node(null, 0, 'Null', 40, 40));
    _dynamic_nodes.push(new ListNode(null, null, 0, 'Null', 40, 40));

    await UpdateLayout__NoPhysics();
}

function ChangeClassWithRetain(object, ind, selection, save, change_to) {
    if (selection[ind].classList.contains(save)) {
        change_to += ' ' + save;
    }
    return change_to;
}
function HighlightVersion(version_num) {
    if (chosen_version === version_num) {
        ver_svg.select('g.nodes').select("[id='" + version_num + "']").dispatch('click');
        ver_svg.select('g.nodes').select("[id='" + version_num + "']").dispatch('click');
    } else {
        ver_svg.select('g.nodes').select("[id='" + version_num + "']").dispatch('click');
    }
}
function TurnOffVersionHighlighting() {
    if (chosen_version < 0) {
        observer.stop = true;
        return;
    }
    ver_svg.select('g.nodes').select("[id='" + chosen_version + "']").dispatch('click');
}
function VersionClick(event, object) {
    let version = _versions[object.id];

    if (chosen_version === version.id) { // Version is same, return graph to default
        main_svg.select('g.nodes')
            .selectAll('circle')
            .attr('class', (object, ind, selection) => {
                return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'regular_node')
            });
        main_svg.select('g.links')
            .selectAll('line')
            .attr('class', (object, ind, selection) => {
                return ChangeClassWithRetain(object, ind, selection, 'blink_link', 'arrow_link')
            });
        main_svg.select('g.texts')
            .selectAll('text')
            .attr('class', 'graph_text');

        sec_svg.select('g.nodes')
            .selectAll('circle')
            .attr('class', (object, ind, selection) => {
                return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'regular_node')
            });
        sec_svg.select('g.links')
            .selectAll('line')
            .attr('class', (object, ind, selection) => {
                return ChangeClassWithRetain(object, ind, selection, 'blink_link', 'arrow_link')
            });
        sec_svg.select('g.texts')
            .selectAll('text')
            .attr('class', 'graph_text');

        chosen_version = -1;
        observer.stop = true;
        return;
    }


    chosen_version = version.id;    // New version clicked, make all graph faint
    main_svg.select('g.nodes')
        .selectAll('circle')
        .attr('class', (object, ind, selection) => {
            return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'faint_node')
        });
    main_svg.select('g.links')
        .selectAll('line')
        .attr('class', (object, ind, selection) => {
            return ChangeClassWithRetain(object, ind, selection, 'blink_link', 'faint_arrow_link')
        });
    main_svg.select('g.texts')
        .selectAll('text')
        .attr('class', 'faint_text');

    sec_svg.select('g.nodes')
        .selectAll('circle')
        .attr('class', (object, ind, selection) => {
            return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'faint_node')
        });
    sec_svg.select('g.links')
        .selectAll('line')
        .attr('class', (object, ind, selection) => {
            return ChangeClassWithRetain(object, ind, selection, 'blink_link', 'faint_arrow_link')
        });
    sec_svg.select('g.texts')
        .selectAll('text')
        .attr('class', 'faint_text');

    if (version.tail === 0) {
        main_svg.select('g.nodes')   // Null version, show null node only
            .select("[id='0']")
            .attr('class', (object, ind, selection) => {
                return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'null_node')
            });
        main_svg.select('g.texts')
            .select("[id='0']")
            .attr('class', 'graph_text');
        observer.stop = true;
        return;
    }

    let curr_node = main_svg.select('g.nodes')   // Draw the body with black nodes
        .select("[id='" + version.tail + "']");
    let curr_link = main_svg.select('g.links')
        .select("[id='" + (version.tail - 1) + "']");
    let curr_text = main_svg.select('g.texts')
        .select("[id='" + version.tail + "']");
    while (Number(curr_node.attr('id')) >= version.head) {
        curr_node.attr('class', (object, ind, selection) => {
            return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'mid_node')
        });
        if (Number(curr_node.attr('id')) > version.head) {
            curr_link.attr('class', (object, ind, selection) => {
                return ChangeClassWithRetain(object, ind, selection, 'blink_link', 'arrow_link')
            });
        }
        curr_text.attr('class', 'graph_text');
        curr_link = main_svg.select('g.links')
            .select("[id='" + (_nodes[Number(curr_node.attr('id'))].son_id - 1) + "']");
        curr_node = main_svg.select('g.nodes')
            .select("[id='" + _nodes[Number(curr_node.attr('id'))].son_id + "']");
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
            curr_node.attr('class', (object, ind, selection) => {
                return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'operational_node')
            });
            if (_dynamic_links[curr_link.attr('id')].target.id !== 0) {
                curr_link.attr('class', (object, ind, selection) => {
                    return ChangeClassWithRetain(object, ind, selection, 'blink_link', 'arrow_link')
                });
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
            curr_node.attr('class', (object, ind, selection) => {
                return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'dynamic_node')
            });
            if (_dynamic_links[curr_link.attr('id')].target.id !== 0) {
                curr_link.attr('class', (object, ind, selection) => {
                    return ChangeClassWithRetain(object, ind, selection, 'blink_link', 'arrow_link')
                });
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
            .attr('class', (object, ind, selection) => {
                return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'null_node')
            });
        sec_svg.select('g.texts')
            .select("[id='0']")
            .attr('class', 'graph_text');
    }


    main_svg.select('g.nodes')       // Draw head and tail nodes
        .select("[id='" + version.head + "']")
        .attr('class', (object, ind, selection) => {
            return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'head_node')
        });
    main_svg.select('g.nodes')
        .select("[id='" + version.tail + "']")
        .attr('class', (object, ind, selection) => {
            return ChangeClassWithRetain(object, ind, selection, 'blink_node', 'tail_node')
        });
    observer.stop = true;
}

function PopupMouseOverVersionNode(event, object) {
    let popup = document.getElementById('version_node_popup');
    let a = document.querySelector(`#versions_svg #ver_nodes [id='${object.id}']`).getBoundingClientRect();
    let x_coord = a.left;
    let y_coord = a.bottom + window.scrollY + 18;
    popup.style.left = x_coord + 'px';
    popup.style.top = y_coord + 'px';
    let head = _nodes[object.head].label;
    let tail = _nodes[object.tail].label;
    let leading_dynamic = object.dynamic_list !== null ? _dynamic_nodes[object.dynamic_list].label : 'Null';
    let leading_operational = object.operational_list !== null ? _dynamic_nodes[object.operational_list].label : 'Null';
    document.getElementById('head_id').innerHTML = ' ' + head;
    document.getElementById('tail_id').innerHTML = ' ' + tail;
    document.getElementById('dynamic_id').innerHTML = ' ' + leading_dynamic;
    document.getElementById('operational_id').innerHTML = ' ' + leading_operational;
    popup.classList.remove('hide_popup');
    popup.classList.add('show_popup');
}
function PopupMouseOutVersionNode() {
    let popup = document.getElementById('version_node_popup');
    popup.classList.remove('show_popup');
    popup.classList.add('hide_popup');
}
function PopupMouseOverMainNode(event, object) {
    let popup = document.getElementById('main_node_popup');
    let a = document.querySelector(`#main_svg #main_nodes [id='${object.id}']`).getBoundingClientRect();
    let x_coord = a.left;
    let y_coord = a.bottom + window.scrollY + 10;
    popup.style.left = x_coord + 'px';
    popup.style.top = y_coord + 'px';
    let son_id = object.son_id !== null ? _nodes[object.son_id].label : 'Null';
    document.getElementById('main_node_son_id').innerHTML = ' ' + son_id;
    popup.classList.remove('hide_popup');
    popup.classList.add('show_popup');
}
function PopupMouseOutMainNode() {
    let popup = document.getElementById('main_node_popup');
    popup.classList.add('hide_popup');
    popup.classList.remove('show_popup');
}
function PopupMouseOverDynamicNode(event, object) {
    let popup = document.getElementById('dynamic_node_popup');
    let a = document.querySelector(`#secondary_svg #sec_nodes [id='${object.id}']`).getBoundingClientRect();
    let x_coord = a.left;
    let y_coord = a.bottom + window.scrollY + 10;
    popup.style.left = x_coord + 'px';
    popup.style.top = y_coord + 'px';
    let son = object.next_list !== null ? _dynamic_nodes[object.next_list].label : 'Null';
    let target_node = object.target_node !== null ? _nodes[object.target_node].label : 'Null';
    document.getElementById('dynamic_node_son_id').innerHTML = ' ' + son;
    document.getElementById('dynamic_node_target_id').innerHTML = ' ' + target_node;
    popup.classList.remove('hide_popup');
    popup.classList.add('show_popup');
}
function PopupMouseOutDynamicNode() {
    let popup = document.getElementById('dynamic_node_popup');
    popup.classList.add('hide_popup');
    popup.classList.remove('show_popup');
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

function OpenSideBar() {
    let sidebar = document.getElementById('side_bar');
    sidebar.classList.remove('close_sidebar');
    sidebar.classList.add('open_sidebar');
}
function CloseSideBar() {
    let sidebar = document.getElementById('side_bar');
    sidebar.classList.remove('open_sidebar');
    sidebar.classList.add('close_sidebar');
}

function FloatingWindowCloser() {
    if (instruction_is_open) {
        HideInstruction();
        instruction_is_open = false;
    } else if (random_graph_params_is_open) {
        HideRandomGraphParams();
        random_graph_params_is_open = false;
    }
}

function InstructionToggler() {
    if (instruction_is_open) {
        HideInstruction();
    } else {
        ShowInstruction();
    }
    instruction_is_open = !instruction_is_open;
}
function ShowInstruction() {
    let overlay = document.getElementById('overlay');
    overlay.classList.remove('overlay_off');
    overlay.classList.add('overlay_on');
    let instruction = document.getElementById('instruction_block');
    instruction.classList.remove('close_instruction');
    instruction.classList.add('open_instruction');
}
function HideInstruction() {
    let overlay = document.getElementById('overlay');
    overlay.classList.remove('overlay_on');
    overlay.classList.add('overlay_off');
    let instruction = document.getElementById('instruction_block');
    instruction.classList.remove('open_instruction');
    instruction.classList.add('close_instruction');
}

function RandomGraphParamsToggler() {
    if (random_graph_params_is_open) {
        HideRandomGraphParams();
    } else {
        ShowRandomGraphParams();
    }
    random_graph_params_is_open = !random_graph_params_is_open;
}
function ShowRandomGraphParams() {
    let overlay = document.getElementById('overlay');
    overlay.classList.remove('overlay_off');
    overlay.classList.add('overlay_on');
    let instruction = document.getElementById('random_graph_block');
    instruction.classList.remove('close_random_graph_block');
    instruction.classList.add('open_random_graph_block');
}
function HideRandomGraphParams() {
    let overlay = document.getElementById('overlay');
    overlay.classList.remove('overlay_on');
    overlay.classList.add('overlay_off');
    let instruction = document.getElementById('random_graph_block');
    instruction.classList.remove('open_random_graph_block');
    instruction.classList.add('close_random_graph_block');
}