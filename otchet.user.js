// ==UserScript==
// @name         Шаблоны отписей КП
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Блочные шаблоны для отчётов в блог с формами заполнения
// @author       Первая версия и идея принадлежат OGRTSV; исправления, доработка, улучшения и текущая поддержка осуществляются игроком Горицвет [1705753]
// @match        http*://*.catwar.net/*
// @match        http*://*.catwar.su/*
// @updateURL    https://github.com/SpringChaos-boop/templates/raw/refs/heads/main/otchet.user.js
// @downloadURL  https://github.com/SpringChaos-boop/templates/raw/refs/heads/main/otchet.user.js
// @grant        none
// @license      MIT
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const CONFIG = {
    VERSION: 3,
    DEBUG: false,
    HOTKEY: 'Alt+T',
    BACKUP_LIMIT: 10,
    LAST_VALUES_LIMIT: 10
  };

  const KEYS = {
    DATA: 'cw_tmpl_data',
    BACKUP: 'cw_tmpl_backups',
    MYID: 'cw_tmpl_myid',
    LAST_VALUES: 'cw_tmpl_lastvals',
    BUILTIN_VER: 'cw_tmpl_builtin_ver'
  };
    // ════════════════════════════════════════════
  //  ВРЕМЯ ПО МСК (UTC+3)
  // ════════════════════════════════════════════
  function getMskDate() {
    try {
      // Берет время по часовому поясу Москвы и превращает в локальный объект Date
      return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    } catch(e) {
      // Если браузер очень старый и не знает про Москву — берет локальное (на всякий случай)
      return new Date();
    }
  };

  // ════════════════════════════════════════════
  //  ВСТРОЕННЫЕ ШАБЛОНЫ
  // ════════════════════════════════════════════
  const BUILTIN_VERSION = 51;
  const BUILTIN_GROUPS = [
    {
      mask: "blog54068",
      templates: [
        {
          name: "Отчёт о патруле",
          blocks: [
            { type: "text", value: "[u]Отчёт о патруле, дата и время — " },
            { type: "date_ddmm" },
            { type: "text", value: " | " },
            { type: "time_manual", label: "Время (ЧЧ:ММ)", placeholder: "10:00" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Собирающий: ", bold: true },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "Ведущие: ", bold: true },
            { type: "other_userid", label: "Ведущие", style: "link_id", separator: ", " },
            { type: "newline" },
            { type: "text_switch", watchKey: "route2", value: "Участники первого маршрута: ", altValue: "Участники общего маршрута: ", bold: true },
            { type: "other_userid", label: "Участники 1-го маршрута", style: "link_id", separator: ", " },
            {
              type: "checkbox_group", key: "route2", label: "Был 2-й маршрут",
              blocks: [
                { type: "newline" },
                { type: "text", value: "Участники второго маршрута: ", bold: true },
                { type: "other_userid", label: "Участники 2-го маршрута", style: "link_id", separator: ", " }
              ]
            }
          ]
        },
        {
          name: "Отчёт о внешнем патруле",
          blocks: [
            { type: "text", value: "[u]Отчёт о внешнем патруле, дата и время — " },
            { type: "date_ddmm" },
            { type: "text", value: " | " },
            { type: "time_manual", label: "Время (ЧЧ:ММ)", placeholder: "10:00" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Собирающий: ", bold: true },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "Ведущий: ", bold: true },
            { type: "other_userid", label: "Ведущий", style: "link_id", separator: ", " },
            { type: "newline" },
            { type: "text", value: "Участники внешнего патруля: ", bold: true },
            { type: "other_userid", label: "Участники (первого пометь как «(ведущий)»)", style: "link_id", separator: ", " }
          ]
        },
          {
          name: "Отчёт о дозоре",
          blocks: [
            { type: "text", value: "[u]Отчёт о дозоре, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Дозорный: ", bold: true },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },

            { type: "text", value: "Время: ", bold: true },
            { type: "time_manual", label: "Время начала", placeholder: "hh:mm" },
            { type: "text", value: " — " },
            { type: "time_manual", label: "Время конца", placeholder: "hh:mm" },
            { type: "text", value: " [b][" },
            { type: "time_manual", label: "Длительность (hh:mm)", placeholder: "hh:mm" },
            { type: "text", value: "][/b]" },

            { type: "newline" },
            { type: "text", value: "Место дозора: ", bold: true },
            { type: "user_text", label: "Место дозора", placeholder: "..." },
            { type: "newline" },
            { type: "url_with_text", label: "Ссылка на запись о начале (в самом низу)", linkText: "запись о начале дозора" }
          ]
        },
         {
          name: "Отчёт о внешнем дозоре",
          blocks: [
            { type: "text", value: "[u]Отчёт о внешнем дозоре, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Внешний дозорный: ", bold: true },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },

            { type: "text", value: "Время: ", bold: true },
            { type: "time_manual", label: "Время начала", placeholder: "hh:mm" },
            { type: "text", value: " — " },
            { type: "time_manual", label: "Время конца", placeholder: "hh:mm" },
            { type: "text", value: " [b][" },
            { type: "time_manual", label: "Длительность (hh:mm)", placeholder: "hh:mm" },
            { type: "text", value: "][/b]" },

            { type: "newline" },
            { type: "text", value: "Место внешнего дозора: ", bold: true },
            { type: "user_text", label: "Место внешнего дозора", placeholder: "..." },
            { type: "newline" },
            { type: "url_with_text", label: "Ссылка на запись о начале (в самом низу)", linkText: "запись о начале дозора" }
          ]
        },
        {
          name: "Начало дозора",
          blocks: [
            { type: "text", value: "Я, " },
            { type: "userid", style: "link", bold: true },
            { type: "text", value: ", начинаю " },
            { type: "select", label: "Тип дозора", options: ["дозор", "внешний дозор"], default: "дозор" },
            { type: "text", value: " на " },
            { type: "select", label: "Где", options: ["локации", "маршруте №"], default: "локации" },
            { type: "text", value: " " },
            { type: "user_text", label: "Название локации / номер маршрута", placeholder: "Центральная площадь / 5" }
          ]
        }
      ]
    },
    {
      mask: "blog54307",
      templates: [
        {
          name: "Отчёт об охоте",
          blocks: [
            { type: "text", value: "[u]Отчёт об охоте, дата и время — " },
            { type: "date_ddmm" },
            { type: "text", value: " | " },
            { type: "time_manual", label: "Время (ЧЧ:ММ)", placeholder: "10:00" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Собирающий: ", bold: true },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "Ведущий: ", bold: true },
            { type: "other_userid", label: "Ведущий", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "Участники и кол-во их дичи: ", bold: true },
            { type: "other_userid", label: "Участники (ID + кол-во)", style: "link_id_count", separator: ", " }
          ]
        },
        {
          name: "Отчёт о свободной охоте",
          blocks: [
            { type: "text", value: "[u]Отчёт о свободной охоте, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], поймал [" },
            { type: "number", label: "Кол-во дичи", placeholder: "кол-во" },
            { type: "text", value: "] дичи вне охотничьего патруля. " },
            { type: "newline" },

            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот", linkText: "скриншот пойманного" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт об охотничьих соревнованиях",
          blocks: [
            { type: "text", value: "[u]Отчёт об охотничьих соревнованиях, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Собирающий: ", bold: true },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "Ведущий: ", bold: true },
            { type: "other_userid", label: "Ведущий", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "Победители: ", bold: true },
            { type: "other_userid", label: "Победители", style: "link_id", separator: ", " },
            { type: "newline" },
            { type: "text", value: "Участники и кол-во их дичи: ", bold: true },
            { type: "other_userid", label: "Участники (унесённая/пойманная)", style: "link_id_count2", separator: ", " }
          ]
        },
        {
          name: "Отчёт о чистке",
          blocks: [
            { type: "text", value: "[u]Отчёт о чистке, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], убрал падаль в Холодной пещере [" },
            { type: "number", label: "Кол-во раз", placeholder: "кол-во" },
            { type: "text", value: "]." },
            { type: "newline" },

            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот", linkText: "скриншоты до и после чистки / история смешивания" },
            { type: "text", value: "]" }
          ]
        }
      ]
    },
    {
      mask: "blog747591",
      templates: [
        {
          name: "Отчёт о выпуске ученика",
          blocks: [
            { type: "text", value: "[u]Отчёт о выпуске ученика[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], выпустил ученика " },
            { type: "other_userid", label: "Ученик", style: "link_id" },
            { type: "text", value: "." }
          ]
        },
        {
          name: "Отчёт о проведении пробника",
          blocks: [
            { type: "text", value: "[u]Отчёт о проведении пробника[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], принял пробник " },
            { type: "select", key: "prob_type", label: "Тип пробника", options: ["ПВОП", "ПВП"], default: "ПВОП" },
            { type: "text", value: " у ученика " },
            { type: "other_userid", label: "Ученик", style: "link_id" },
            { type: "text", value: "." },
            { type: "newline" },
            { type: "text_switch", watchKey: "prob_type", watchValue: "ПВОП", value: "[b]Участники пробной охоты:[/b] ", altValue: "[b]Участники пробного патруля:[/b] " },
            { type: "other_userid", label: "Участники", style: "link_id", separator: ", " }
          ]
        }
      ]
    },
    {
      mask: "blog56035",
      templates: [
        {
          name: "Отчёт о ловле мышей",
          blocks: [
            { type: "text", value: "[u]Отчёт о ловле мышей[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], поймал и отнёс [" },
            { type: "number", label: "Кол-во мышей", placeholder: "кол-во" },
            { type: "text", value: "] мышей." }
          ]
        },
        {
          name: "Отчёт о посещении сборов",
          blocks: [
            { type: "text", value: "[u]Отчёт о посещении сборов[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], посетил травники [" },
            { type: "number", label: "Кол-во раз", placeholder: "кол-во раз" },
            { type: "text", value: "] и собрал целебные ресурсы [" },
            { type: "number", label: "Кол-во собранного", placeholder: "кол-во собранного" },
            { type: "text", value: "]." }
          ]
        }
      ]
    },
    {
      mask: "blog690138",
      templates: [
        {
          name: "Отчёт о желании получить воспитателя",
          blocks: [
            { type: "text", value: "[u]Отчёт о желании получить воспитателя[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], желаю получить воспитателя. " },
            { type: "newline" },
            { type: "text", value: "[b]Желаемый:[/b] " },
            { type: "checkbox_group", key: "mentor_opt", label: "Указать конкретного воспитателя", blocks: [
              { type: "other_userid", label: "ID Воспитателя", style: "link" }
            ]},
            { type: "text_switch", watchKey: "mentor_opt", value: "", altValue: "отсутствует" }
          ]
        },
        {
          name: "Отчёт о вступлении в отряд",
          blocks: [
            { type: "text", value: "[u]Отчёт о вступлении в отряд[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], желаю вступить в отряд. [" },
            { type: "url_with_text", label: "Ссылка на ВК (внутрь скобок)", linkText: "VK" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о воспитаннике",
          blocks: [
            { type: "select", key: "action_type", label: "Действие с воспитанником", options: ["внесение", "удаление", "выпуск"], default: "внесение", silent: true },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], " },
            { type: "text_switch", watchKey: "action_type", watchValue: "внесение", value: "прошу внести в блог" },
            { type: "text_switch", watchKey: "action_type", watchValue: "удаление", value: "прошу удалить из блога" },
            { type: "text_switch", watchKey: "action_type", watchValue: "выпуск", value: "выпустил в ученики" },
            { type: "text", value: " своего воспитанника " },
            { type: "other_userid", label: "Воспитанник", style: "link_id" },
            { type: "text", value: "." },
            {
              type: "checkbox_group", label: "Указать причину (для удаления)",
              blocks: [
                { type: "newline" },
                { type: "text", value: "[b]Причина:[/b] " },
                { type: "select", options: ["удаление", "уход", "другое"], default: "удаление" },
                { type: "text", value: "." }
              ]
            }
          ]
        },
        {
          name: "Отчёт о проведении лекции",
          blocks: [
            { type: "checkbox", key: "lecture_is_mandatory", label: "Это обязательная лекция?", text: "" },
            { type: "text", value: "[u]Отчёт о проведении " },
            { type: "text_switch", watchKey: "lecture_is_mandatory", value: "обязательной " },
            { type: "text", value: "лекции,  дата и время — " },
            { type: "date_ddmm" },
            { type: "text", value: " | " },
            { type: "time_manual", label: "Время начала", placeholder: "hh:mm" },
            { type: "text", value: " - " },
            { type: "time_manual", label: "Время конца", placeholder: "hh:mm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Просветитель:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Тема лекции:[/b] “" },
            { type: "select", label: "Тема лекции", options: [
              "Что такое котячий клан и каких жуков там едят",
              "Ветви деятельности и их покровители",
              "Баллы нарушений и закон племени",
              "Чрезвычайные ситуации и что в них делать",
              "Церемонии и обряды Крылатого племени",
              "Создание Крылатого племени",
              "Верховное управление: к кому можно обратиться?",
              "Все способы умереть - болезни и травмы",
              "Творческие отряды - горе в семье!",
              "Нырялки и лазалки!",
              "Автономные области и союзы Крылатого племени",
              "Что за звери - скрытые параметры?!",
              "Главный страх крохи: что ждёт в ученичестве?",
              "Система поощрений в Крылатом племени"
            ], default: "Что такое котячий клан и каких жуков там едят" },
            { type: "text", value: "”" },
            { type: "newline" },
            { type: "text", value: "[b]Слушатели:[/b] " },
            { type: "other_userid", label: "Слушатели", style: "link", separator: ",  " },
            {
              type: "checkbox_group", label: "Указать вид лекции и скриншот (только для обычной)",
              blocks: [
                { type: "newline" },
                { type: "text", value: "[b]Вид лекции:[/b] " },
                { type: "select", options: ["активная", "пассивная"], default: "активная" },
                { type: "newline" },
                { type: "url_plain", label: "Ссылка на скриншот (для пассивной)", linkText: "[скриншот]" }
              ]
            }
          ]
        },
        {
          name: "Отчёт о проведении экскурсии",
          blocks: [
            { type: "text", value: "[u]Отчёт о проведении экскурсии[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Просветитель:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Вид экскурсии:[/b] " },
            { type: "select", options: ["лагерная", "внелагерная"], default: "лагерная" },
            { type: "text", value: ", " },
            { type: "select", options: ["полная", "неполная"], default: "полная" },
            { type: "newline" },
            { type: "text", value: "[b]Экскурсант:[/b] " },
            { type: "other_userid", label: "Экскурсант", style: "link" },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншот начала", linkText: "скриншот начала" },
            { type: "text", value: " / " },
            { type: "url_with_text", label: "Ссылка на скриншот конца", linkText: "скриншот конца" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт об активации бабочки",
          blocks: [
            { type: "text", value: "[u]Отчёт об активации бабочки[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Просветитель:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Время активаций:[/b] " },
            { type: "time_manual", label: "Время начала", placeholder: "чч:мм" },
            { type: "text", value: " [" },
            { type: "url_with_text", label: "Ссылка на скриншот начала", linkText: "скриншот" },
            { type: "text", value: "] — " },
            { type: "time_manual", label: "Время конца", placeholder: "чч:мм" },
            { type: "text", value: " [" },
            { type: "url_with_text", label: "Ссылка на скриншот конца", linkText: "скриншот" },
            { type: "text", value: "] [b][" },
            { type: "time_manual", label: "Длительность (чч:мм)", placeholder: "чч:мм" },
            { type: "text", value: "][/b]" }
          ]
        }
      ]
    },
    {
      mask: "blog706184",
      templates: [
        {
          name: "Отчёт о патруле исследователей",
          blocks: [
            { type: "text", value: "[u]Отчёт о патруле исследователей, дата и время — " },
            { type: "date_ddmm" },
            { type: "text", value: " | " },
            { type: "time_manual", label: "Время (ЧЧ:ММ)", placeholder: "10:30" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Собирающий:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Ведущий:[/b] " },
            { type: "other_userid", label: "Ведущий", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "[b]Участники патруля:[/b] " },
            { type: "other_userid", label: "Участники", style: "link_id", separator: ", " }
          ]
        },
        {
          name: "Отчёт о дозоре исследователей",
          blocks: [
            { type: "text", value: "[u]Отчёт о дозоре исследователей, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Дозорный:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Время:[/b] " },
            { type: "time_manual", label: "Время начала", placeholder: "hh:mm" },
            { type: "text", value: " — " },
            { type: "time_manual", label: "Время конца", placeholder: "hh:mm" },
            { type: "text", value: " [b][" },
            { type: "time_manual", label: "Длительность (hh:mm)", placeholder: "hh:mm" },
            { type: "text", value: "][/b]" },
            { type: "newline" },
            { type: "text", value: "[b]Место дозора:[/b] " },
            { type: "select", label: "Локация", options: ["Клыкастая пещера", "Поющий грот", "Извилистый туннель", "Заросшее водорослями ущелье"], default: "Клыкастая пещера" }
          ]
        },
        {
          name: "Начало дозора",
          blocks: [
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: "[/b], начинаю дозор на локации " },
            { type: "select", label: "Локация", options: ["Клыкастая пещера", "Поющий грот", "Извилистый туннель", "Заросшее водорослями ущелье"], default: "Клыкастая пещера" }
          ]
        },
        {
          name: "Отчёт о сопровождении",
          blocks: [
            { type: "text", value: "[u]Отчёт о сопровождении[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Исследователь:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Подопечный:[/b] " },
            { type: "other_userid", label: "Подопечный", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "[b]Заходы:[/b] " },
            { type: "number", label: "Количество заходов в воды", placeholder: "0" },
            { type: "text", value: " раз." }
          ]
        },
        {
          name: "Отчёт о сдаче ресурсов",
          blocks: [
            { type: "text", value: "[u]Отчёт о сдаче ресурсов[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Исследователь:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "select", label: "Подсказка: тип медали", options: ["Проворные лапки", "Надёжный снабженец"], default: "Проворные лапки", silent: true },
            {
              type: "checkbox_group", label: "Сдача на медаль 'Проворные лапки'",
              blocks: [
                { type: "text", value: "[b]Отдано ресурсов:[/b] " },
                { type: "resource_counts", label: "Введите количество (если 0 — не выведется)", options: ["дичь", "целебные ресурсы", "камни", "водяной мох", "ракушки"], separator: ", " }
              ]
            },
            {
              type: "checkbox_group", label: "Сдача на медаль 'Надёжный снабженец'",
              blocks: [
                { type: "text", value: "[b]Отдано ресурсов:[/b] ракушки на +[" },
                { type: "number", placeholder: "0" },
                { type: "text", value: "] ПУ" }
              ]
            },
            { type: "newline" },
            { type: "url_plain", label: "Ссылка на скриншот истории", linkText: "[скриншот истории]" }
          ]
        },
        {
          name: "Отчёт о переходе в ранг",
          blocks: [
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], желаю перейти в ранг [" },
            { type: "number", label: "Номер ранга", placeholder: "номер ранга" },
            { type: "text", value: "]. [" },
            { type: "url_with_text", label: "Ссылка на VK", linkText: "VK" },
            { type: "text", value: "]" },
            { type: "newline" },
            { type: "url_plain", label: "Ссылка на скриншоты требований", linkText: "[скриншоты выполненных требований]" }
          ]
        },
        {
          name: "Отчёт о получении жетончиков",
          blocks: [
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], прокачал свои плавательные умения до [" },
            { type: "number", label: "Уровень", placeholder: "n" },
            { type: "text", value: "] уровня и хочу получить жетончики рыбки. [" },
            { type: "url_with_text", label: "Ссылка на VK", linkText: "VK" },
            { type: "text", value: "]" },
            { type: "newline" },
            { type: "url_plain", label: "Ссылка на скриншот ПУ", linkText: "[скриншот ПУ]" }
          ]
        }
      ]
    },
      {
      mask: "blog735598",
      templates: [
        {
          name: "Отчёт о сопровождении",
          blocks: [
            { type: "text", value: "[u]Отчёт о сопровождении[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Наставляющий:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Подопечный:[/b] " },
            { type: "other_userid", label: "Подопечный", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "[b]Время сопровождения:[/b] " },
            { type: "time_manual", label: "Время начала", placeholder: "hh:mm" },
            { type: "text", value: " [" },
            { type: "url_with_text", label: "Ссылка на скриншот начала", linkText: "скриншот" },
            { type: "text", value: "] — " },
            { type: "time_manual", label: "Время конца", placeholder: "hh:mm" },
            { type: "text", value: " [" },
            { type: "url_with_text", label: "Ссылка на скриншот конца", linkText: "скриншот" },
            { type: "text", value: "] [b][" },
            { type: "time_manual", label: "Длительность (чч:мм)", placeholder: "чч:мм" },
            { type: "text", value: "][/b]" }
          ]
        },
                {
          name: "Отчёт о помощи игроку",
          blocks: [
            { type: "text", value: "[u]Отчёт о помощи игроку[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Наставляющий:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Подопечный:[/b] " },
            { type: "other_userid", label: "Подопечный", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "[b]Вид помощи:[/b] " },
            { type: "select", label: "Вид помощи", options: ["спуск игрока", "составление карты"], default: "спуск игрока" },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот", linkText: "скриншот оказанной помощи" },
            { type: "text", value: "]" }
          ]
        },
         {
          name: "Отчёт о сдаче ресурсов",
          blocks: [
            { type: "text", value: "[u]Отчёт о сдаче ресурсов[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Ступающий:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Отдано ресурсов:[/b] " },
            { type: "resource_counts", label: "Введите количество (пустые не выводятся)", options: ["ядовитую дичь", "дичь", "целебные ресурсы", "камни", "перья"], separator: ", " },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот истории", linkText: "скриншот истории" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о желании получить наставляющего",
          blocks: [
            { type: "text", value: "[u]Отчёт о желании получить наставляющего[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], желаю получить наставляющего." }
          ]
        },
        {
          name: "Отчёт о получении жетончиков",
          blocks: [
            { type: "text", value: "[u]Отчёт о получении жетончиков[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], прокачал свои боевые умения до [" },
            { type: "number", label: "Уровень", placeholder: "N" },
            { type: "text", value: "] уровня и хочу получить жетончики горностая. [" },
            { type: "url_with_text", label: "Ссылка на VK", linkText: "VK" },
            { type: "text", value: "]" },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот БУ", linkText: "скриншот БУ" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о переходе в ранг / наставничестве",
          blocks: [
            // Выбор действия
            { type: "select", key: "action_type", label: "Действие", options: ["перейти в ранг", "стать наставляющим"], default: "перейти в ранг", silent: true },

            // Динамический заголовок
            { type: "text", value: "[u]Отчёт о " },
            { type: "text_switch", watchKey: "action_type", watchValue: "перейти в ранг", value: "переходе в ранг" },
            { type: "text_switch", watchKey: "action_type", watchValue: "стать наставляющим", value: "желании стать наставляющим" },
            { type: "text", value: "[/u]" },
            { type: "newline" },

            // Тело отчёта
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], желаю " },
            { type: "text_switch", watchKey: "action_type", watchValue: "перейти в ранг", value: "перейти в ранг " },
            { type: "text_switch", watchKey: "action_type", watchValue: "стать наставляющим", value: "стать наставляющим" },

            // Номер ранга (появляется только если игрок сам поставит галочку)
            {
              type: "checkbox_group",
              label: "Указать номер ранга (только для перехода)",
              blocks: [
                { type: "text", value: "[" },
                { type: "number", label: "Номер ранга", placeholder: "номер" },
                { type: "text", value: "]" }
              ]
            },

            // Ссылки в конце
            { type: "text", value: ". [" },
            { type: "url_with_text", label: "Ссылка на VK", linkText: "VK" },
            { type: "text", value: "]" },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот ЛУ", linkText: "скриншот ЛУ" },
            { type: "text", value: "]" }
          ]
        }
      ]
    },
          {
      mask: "blog709624",
      templates: [
        {
          name: "Отчёт о вступлении",
          blocks: [
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], желаю вступить в отряд как " },
            {
              type: "multiselect",
              label: "Выберите должности (можно несколько)",
              options: ["слагатель", "рассказчик", "редактор"],
              style: "text_only",
              separator: "/"
            },
            { type: "text", value: ". [" },
            { type: "url_with_text", label: "Ссылка на VK", linkText: "VK" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о пополнении библиотеки",
          blocks: [
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], добавил свою сказку в библиотеку." },
            { type: "newline" },
            { type: "text", value: "[b]Количество слов:[/b] " },
            { type: "number", label: "Кол-во слов", placeholder: "0" }
          ]
        },
                {
          name: "Отчёт о проведении мероприятия",
          blocks: [
            { type: "text", value: "[u]Отчёт о проведении " },
            // Заголовок зависит от того, какая галочка стоит внизу
            { type: "text_switch", watchKey: "is_hour", value: "Часа историй", altValue: "Вечера Сказок" },
            { type: "text", value: "[/u]" },
            { type: "newline" },

            // Блок для Вечера Сказок
            {
              type: "checkbox_group", label: "Заполнить как 'Вечер Сказок'", key: "is_evening",
              blocks: [
                { type: "text", value: "[b]Организатор:[/b] " },
                { type: "userid", style: "link" },
                { type: "text", value: " " },
                { type: "userid", style: "id" },
                { type: "newline" },
                { type: "text", value: "[b]Рассказчики:[/b] " },
                { type: "other_userid", label: "ID Рассказчиков", style: "link_id" },
                { type: "text", value: " — " },
                { type: "user_text", label: "Названия сказок", placeholder: "Сказка 1, Сказка 2" },
                { type: "newline" },
                { type: "text", value: "[b]Актёры:[/b] " },
                { type: "other_userid", label: "Актёры", style: "link_id", separator: ", " },
                { type: "newline" },
                { type: "text", value: "[b]Слушатели:[/b] " },
                { type: "other_userid", label: "Слушатели", style: "link_id", separator: ", " }
              ]
            },

            // Блок для Часа историй
            {
              type: "checkbox_group", label: "Заполнить как 'Час историй'", key: "is_hour",
              blocks: [
                { type: "text", value: "[b]Рассказчик:[/b] " },
                { type: "userid", style: "link" },
                { type: "text", value: " " },
                { type: "userid", style: "id" },
                { type: "newline" },
                { type: "text", value: "[b]Рассказанные сказки:[/b] " },
                { type: "user_text", label: "Названия сказок", placeholder: "Сказка 1, Сказка 2" },
                { type: "newline" },
                { type: "text", value: "[b]Слушатели:[/b] " },
                { type: "other_userid", label: "Слушатели", style: "link_id", separator: ", " }
              ]
            }
          ]
        }
      ]
    },
          {
      mask: "blog729886",
      templates: [
        {
          name: "Отчёт о проведении игр",
          blocks: [
            { type: "text", value: "[u]Отчёт о проведении игр[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Развлекатель:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Проведённые игры:[/b] " },
            { type: "user_text", label: "Названия игр", placeholder: "Название игры" },
            { type: "newline" },
            { type: "text", value: "[b]Участники:[/b] " },
            { type: "other_userid", label: "Участники (ID + баллы)", style: "link_id_points", separator: ", " },
            { type: "newline" },
            { type: "text", value: "[b]Время:[/b] " },
            { type: "time_manual", label: "Время начала", placeholder: "hh:mm" },
            { type: "text", value: " — " },
            { type: "time_manual", label: "Время конца", placeholder: "hh:mm" },
            { type: "text", value: " [b][" },
            { type: "time_manual", label: "Длительность (hh:mm)", placeholder: "hh:mm" },
            { type: "text", value: "][/b]" }
          ]
        },
        {
          name: "Отчёт о чистке локации",
          blocks: [
            { type: "text", value: "[u]Отчёт о чистке локации[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], провёл уборку на Солнечной лужайке." },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншоты", linkText: "локация до и после + история смешивания" },
            { type: "text", value: "]" }
          ]
        }
      ]
    },
          {
      mask: "blog730585",
      templates: [
        {
          name: "Отчёт о пожертвовании кролей",
          blocks: [
            { type: "text", value: "[u]Отчёт о пожертвовании кролей[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], перевёл [" },
            { type: "number", label: "Кол-во кролей", placeholder: "кол-во" },
            { type: "text", value: "] кролей банкиру на нужды племени. " },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот перевода", linkText: "скриншот перевода" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о продаже фракционных предметов",
          blocks: [
            { type: "text", value: "[u]Отчёт о продаже фракционных предметов[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], продал фракционные предметы и перевёл заработанные [" },
            { type: "number", label: "Кол-во кролей", placeholder: "кол-во" },
            { type: "text", value: "] кролей банкиру. " },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншоты", linkText: "скриншот продажи + скриншот перевода" },
            { type: "text", value: "]" }
          ]
        }
      ]
    },
          {
      mask: "blog384150",
      templates: [
        {
          name: "Отчёт о сопровождении игрока по лабиринту",
          blocks: [
            { type: "text", value: "[u]Отчёт о сопровождении игрока по лабиринту, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Нейтральщик:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Подопечный:[/b] " },
            { type: "other_userid", label: "Подопечный", style: "link_id" },

            // Скриншот добавляется только если подопечный - воитель
            {
              type: "checkbox_group", label: "Подопечный – воитель (добавить скриншот)",
              blocks: [
                { type: "newline" },
                { type: "text", value: "[" },
                { type: "url_plain", label: "Ссылка на скриншот", linkText: "скриншот просьбы с указанием причины выхода" },
                { type: "text", value: "]" }
              ]
            }
          ]
        },
        {
          name: "Отчёт о вызволении игрока из лабиринта",
          blocks: [
            { type: "text", value: "[u]Отчёт о вызволении игрока из лабиринта, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Нейтральщик:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Кому помог:[/b] " },
            { type: "other_userid", label: "Кому помог", style: "link_id" }
          ]
        },
        {
          name: "Отчёт о помощи (Обмен/Перенос)",
          blocks: [
            // Тихий список для выбора текста
            { type: "select", key: "help_type", label: "Тип помощи", options: ["обмене", "переносе предметов"], default: "обмене", silent: true },

            { type: "text", value: "[u]Отчёт о помощи в " },
            { type: "text_switch", watchKey: "help_type", watchValue: "обмене", value: "обмене" },
            { type: "text_switch", watchKey: "help_type", watchValue: "переносе предметов", value: "переносе предметов" },
            { type: "text", value: ", дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Нейтральщик:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Кому помог:[/b] " },
            { type: "other_userid", label: "Кому помог", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "[b]Заходы:[/b] [" },
            { type: "number", label: "Кол-во заходов", placeholder: "кол-во" },
            { type: "text", value: "]" },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншоты", linkText: "скриншот запроса помощи + скриншот обмена предметов" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о сопровождении (Переход/Ученик)",
          blocks: [
            // Тихий список для выбора текста
            { type: "select", key: "escort_type", label: "Тип сопровождения", options: ["переходящего не по лабиринту", "ученика на нейтральные земли"], default: "переходящего не по лабиринту", silent: true },

            { type: "text", value: "[u]Отчёт о сопровождении " },
            { type: "text_switch", watchKey: "escort_type", watchValue: "переходящего не по лабиринту", value: "переходящего не по лабиринту" },
            { type: "text_switch", watchKey: "escort_type", watchValue: "ученика на нейтральные земли", value: "ученика на нейтральные земли" },
            { type: "text", value: ", дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Нейтральщик:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Подопечный:[/b] " },
            { type: "other_userid", label: "Подопечный", style: "link_id" }
          ]
        }
      ]
    },
      {
      mask: "blog808521",
      templates: [
        {
          name: "Отчёт о помощи (Туннели/Нейтральные земли)",
          blocks: [
            { type: "select", key: "rescue_type", label: "Где помогли?", options: ["туннелях", "нейтральных землях"], default: "туннелях", silent: true },
            { type: "text", value: "[u]Отчёт о помощи " },
            { type: "text_switch", watchKey: "rescue_type", watchValue: "туннелях", value: "заплутавшему в туннелях" },
            { type: "text_switch", watchKey: "rescue_type", watchValue: "нейтральных землях", value: "на нейтральных землях" },
            { type: "text", value: ", дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Компаньон:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Подопечный:[/b] " },
            { type: "other_userid", label: "Подопечный", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншоты", linkText: "скриншот запроса помощи + скриншот подопечного" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о помощи в переносе ресурсов",
          blocks: [
            { type: "text", value: "[u]Отчёт о помощи в переносе ресурсов, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Помощник:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Подопечный:[/b] " },
            { type: "other_userid", label: "Подопечный", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "[b]Перенесено ресурсов:[/b] [" },
            { type: "number", label: "Кол-во ресурсов", placeholder: "кол-во" },
            { type: "text", value: "]" },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншоты", linkText: "скриншот ресурсов на локации, где собраны + скриншот ресурсов на локации, куда доставлены" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о сборе паутины в туннелях",
          blocks: [
            { type: "text", value: "[u]Отчёт о сборе паутины в туннелях, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Туннельщик:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Собрано паутины:[/b] [" },
            { type: "number", label: "Кол-во паутины", placeholder: "кол-во" },
            { type: "text", value: "]" },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншоты", linkText: "скриншот истории + скриншот паутины в пещере знахаря" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о сборе ресурсов на нейтральных локациях",
          blocks: [
            { type: "text", value: "[u]Отчёт о сборе ресурсов на нейтральных локациях, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Собиратель:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Собрано ресурсов:[/b] " },
            { type: "resource_counts", label: "Введите количество (пустые не выводятся)", options: ["травы", "мох", "крепкие ветки", "вьюнки", "водяной мох", "игрушечные камни"], separator: ", " },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншоты", linkText: "скриншот истории + скриншот ресурса на локации, куда доставлен" },
            { type: "text", value: "]" }
          ]
        }
      ]
    },
          {
      mask: "blog794025",
      templates: [
        {
          name: "Отчёт о вступлении",
          blocks: [
            { type: "text", value: "[u]Отчёт о вступлении[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], желаю вступить в отряд." }
          ]
        },
        {
          name: "Отчёт о рекламном комментарии",
          blocks: [
            { type: "text", value: "[u]Отчёт о рекламном комментарии[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], рассказал о племени, написав [" },
            { type: "select", label: "Длина комментария", options: ["короткий", "средний", "длинный"], default: "короткий" },
            { type: "text", value: "] комментарий." },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншот сообщения", linkText: "скриншот сообщения в чате" },
            { type: "text", value: "] + [" },
            { type: "url_with_text", label: "Ссылка на пост", linkText: "ссылка на пост в ленте" },
            { type: "text", value: "]" }
          ]
        },
          {
          name: "Отчёт о помощи игроку",
          blocks: [
            { type: "text", value: "[u]Отчёт о помощи игроку[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], помог игроку по имени " },
            { type: "other_userid", label: "Игрок", style: "link_id" },
            { type: "text", value: " и ответил на вопросы о племени [" },
            { type: "number", label: "Кол-во раз", placeholder: "кол-во" },
            { type: "text", value: "] раз." },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншот", linkText: "скриншот сообщения в чате" },
            { type: "text", value: "] + [" },
            { type: "url_with_text", label: "Ссылка на пост в ленте (если проходил в ленте)", linkText: "ссылка на пост в ленте" },
            { type: "text", value: "]" }
          ]
        },
          {
          name: "Отчёт об отправке шаблона рекламы",
          blocks: [
            { type: "select", key: "ad_type", label: "Тип шаблона", options: ["обычный", "личный"], default: "обычный", silent: true },
            { type: "text", value: "[u]Отчёт об отправке " },
            { type: "text_switch", watchKey: "ad_type", watchValue: "личный", value: "личного " },
            { type: "text", value: "шаблона рекламы[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], поделился " },
            { type: "text_switch", watchKey: "ad_type", watchValue: "личный", value: "личным шаблоном рекламы." },
            { type: "text_switch", watchKey: "ad_type", watchValue: "обычный", value: "шаблоном рекламы." },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншот", linkText: "скриншот отправленного шаблона" },
            { type: "text", value: "]" },
            { type: "url_with_text", label: "Ссылка на пост (если опубликован в ленте)", linkText: "ссылка на пост в ленте", prefix: " + [", suffix: "]" }
          ]
        },
        {
          name: "Отчёт о выигранном аукционе",
          blocks: [
            { type: "select", key: "auction_type", label: "Где выигран аукцион", options: ["закреп в группе", "аукцион на сайте"], default: "закреп в группе", silent: true },
            { type: "text", value: "[u]Отчёт о выигранном " },
            { type: "text_switch", watchKey: "auction_type", watchValue: "закреп в группе", value: "закрепе в группе" },
            { type: "text_switch", watchKey: "auction_type", watchValue: "аукцион на сайте", value: "аукционе рекламы на сайте" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], выиграл " },
            { type: "text_switch", watchKey: "auction_type", watchValue: "закреп в группе", value: "закреп в группе Вселенной творцов. " },
            { type: "text_switch", watchKey: "auction_type", watchValue: "аукцион на сайте", value: "аукцион рекламы на сайте. " },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_with_text", label: "Ссылка на скриншот аукциона", linkText: "скриншот аукциона" },
            { type: "text", value: "]" }
          ]
        }
      ]
    },
          {
      mask: "blog974885",
      templates: [
                {
          name: "Отчёт о проведении мероприятия",
          blocks: [
            // Выбор типа мероприятия (в текст не выводится)
            { type: "select", key: "event_type", label: "Тип мероприятия", options: ["тренировочных боёв", "боевых игр", "практического занятия", "индивидуального занятия", "побоища"], default: "тренировочных боёв", silent: true },

            { type: "text", value: "[u]Отчёт о проведении " },
            // Автоматическая подстановка заголовка
            { type: "text_switch", watchKey: "event_type", watchValue: "тренировочных боёв", value: "тренировочных боёв" },
            { type: "text_switch", watchKey: "event_type", watchValue: "боевых игр", value: "боевых игр" },
            { type: "text_switch", watchKey: "event_type", watchValue: "практического занятия", value: "практического занятия" },
            { type: "text_switch", watchKey: "event_type", watchValue: "индивидуального занятия", value: "индивидуального занятия" },
            { type: "text_switch", watchKey: "event_type", watchValue: "побоища", value: "побоища" },

            { type: "text", value: ", дата" },
            // Добавляем слово "и время" только для практического занятия
            { type: "text_switch", watchKey: "event_type", watchValue: "практического занятия", value: " и время" },
            { type: "text", value: " — " },
            { type: "date_ddmm" },

            // Время (появляется только если поставить галочку)
            {
              type: "checkbox_group", label: "Указать время (только для практического занятия)",
              blocks: [
                { type: "text", value: " | " },
                { type: "time_manual", label: "Время начала", placeholder: "hh:mm" },
                { type: "text", value: " - " },
                { type: "time_manual", label: "Время конца", placeholder: "hh:mm" }
              ]
            },
            { type: "text", value: "[/u]" },
            { type: "newline" },

            { type: "text", value: "[b]Проводящий:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },

            // Тема занятия (появляется только если поставить галочку)
            {
              type: "checkbox_group", label: "Указать тему занятия (только для практического занятия)",
              blocks: [
                { type: "text", value: "[b]Тема занятия [" },
                { type: "user_text", label: "Ранг", placeholder: "ранг" },
                { type: "text", value: "][/b]: " },
                { type: "user_text", label: "Тема", placeholder: "тема" },
                { type: "newline" }
              ]
            },

            { type: "text", value: "[b]Участники[/b]: " },
            { type: "other_userid", label: "Участники", style: "link_id", separator: ", " },

            // Целитель (появляется только если поставить галочку)
            {
              type: "checkbox_group", label: "Указать целителя (только для побоища)",
              blocks: [
                { type: "newline" },
                { type: "text", value: "[b]Целитель[/b]: " },
                { type: "other_userid", label: "Целитель", style: "link_id" }
               ]
            }
          ]
        }
      ]
    },
              {
      mask: "blog688000",
      templates: [
        {
          name: "Отчёт о патруле стражей покоя",
          blocks: [
            { type: "text", value: "[u]Отчёт о патруле стражей покоя, дата и время — " },
            { type: "date_ddmm" },
            { type: "text", value: " | " },
            { type: "time_manual", label: "Время (ЧЧ:ММ)", placeholder: "10:30" },
            { type: "text", value: "[/u]" },
            { type: "newline" },

            { type: "text", value: "[b]Собирающий:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },

            { type: "text", value: "[b]Ведущие:[/b] " },
            { type: "other_userid", label: "Ведущие", style: "link_id", separator: ", " },
            { type: "newline" },

            { type: "text_switch", watchKey: "route2", value: "[b]Участники первого маршрута:[/b] ", altValue: "[b]Участники общего маршрута:[/b] ", bold: false },
            { type: "other_userid", label: "Участники 1-го маршрута", style: "link_id", separator: ", " },

            {
              type: "checkbox_group", key: "route2", label: "Был 2-й маршрут",
              blocks: [
                { type: "newline" },
                { type: "text", value: "[b]Участники второго маршрута:[/b] " },
                { type: "other_userid", label: "Участники 2-го маршрута", style: "link_id", separator: ", " }
              ]
            },

            // Унесённые (появляются только если поставить галочку)
            {
              type: "checkbox_group", label: "Были унесённые",
              blocks: [
                { type: "newline" },
                { type: "text", value: "[b]Унесённые:[/b] " },
                { type: "taken_list", label: "Заполните данные (ID найденного, локация, ID унёсшего)" }
              ]
            }
          ]
        },
        {
          name: "Отчёт о чистке локаций",
          blocks: [
            { type: "text", value: "[u]Отчёт о чистке локаций[/u]" },
            { type: "newline" },

            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], унёс [" },
            { type: "number", label: "Кол-во унесённых котов", placeholder: "кол-во" },
            { type: "text", value: "] котов." },
            { type: "newline" },

            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот истории", linkText: "скриншот истории" },
            { type: "text", value: "]" }
          ]
        }
      ]
    },
          {
      mask: "blog950085",
      templates: [
        {
          name: "Отчёт о занятии",
          blocks: [
            { type: "text", value: "Я, " },
            { type: "userid", style: "id", bold: true },
            { type: "text", value: ", занял " },
            { type: "select", label: "Кого занял", options: ["Кабаргу", "Нокоу"], default: "Кабаргу" },
            { type: "text", value: " с " },
            { type: "time_manual", label: "Начало", placeholder: "hh:mm" },
            { type: "text", value: " до " },
            { type: "time_manual", label: "Конец", placeholder: "hh:mm" },
            { type: "text", value: "." }
          ]
        },
        {
          name: "Отчёт об активной охоте",
          blocks: [
            { type: "text", value: "[u]Отчёт об активной охоте, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], получил [" },
            { type: "number", label: "Кол-во дичи", placeholder: "кол-во" },
            { type: "text", value: "] дичи с кабарги. " },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот", linkText: "скриншот пойманного" },
            { type: "text", value: "]" }
          ]
        },
          {
          name: "Отчёт о приготовлении смесей",
          blocks: [
            { type: "text", value: "[u]Отчёт о приготовлении смесей, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], получил шишки от Нокоу и приготовил [" },
            { type: "number", label: "Кол-во смесей", placeholder: "кол-во" },
            { type: "text", value: "] смесей. " },
            { type: "newline" },

            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот шишек", linkText: "скриншот шишек" },
            { type: "text", value: "] + [" },
            { type: "url_plain", label: "Ссылка на скриншот готовых смесей", linkText: "скриншот готовых смесей" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о помощи погонщика",
          blocks: [
            { type: "text", value: "[u]Отчёт о помощи погонщика — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Активатор:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },
            { type: "text", value: "[b]Подопечный:[/b] " },
            { type: "other_userid", label: "Подопечный", style: "link_id" },
            { type: "newline" },
            { type: "text", value: "[b]Запуски:[/b] " },
            { type: "number", label: "Кол-во активаций", placeholder: "кол-во" }
          ]
        }
      ]
    },
          {
      mask: "blog669659",
      templates: [
        {
          name: "Отчёт об охоте",
          blocks: [
            { type: "text", value: "[u]Отчёт об охоте, дата и время — " },
            { type: "date_ddmm" },
            { type: "text", value: " | " },
            { type: "time_manual", label: "Время (ЧЧ:ММ)", placeholder: "10:00" },
            { type: "text", value: "[/u]" },
            { type: "newline" },

            { type: "text", value: "[b]Собирающий:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },

            { type: "text", value: "[b]Ведущий:[/b] " },
            { type: "other_userid", label: "Ведущий", style: "link_id" },
            { type: "newline" },

            { type: "text", value: "[b]Участники-охотники:[/b] " },
            { type: "other_userid", label: "Охотники (ID + дичь)", style: "link_id_count", separator: ", " },

            // Помощники (появляются только если поставить галочку)
            {
              type: "checkbox_group", label: "Были носильщики",
              blocks: [
                { type: "newline" },
                { type: "text", value: "[b]Участники-помощники*:[/b] " },
                { type: "other_userid", label: "Помощники (ID + отнесено)", style: "link_id_count", separator: ", " }
              ]
            }
          ]
        },
        {
          name: "Отчёт о патруле",
          blocks: [
            { type: "select", key: "patrol_type", label: "Тип патруля", options: ["лагерном", "внелагерном"], default: "лагерном", silent: true },
            { type: "text", value: "[u]Отчёт о " },
            { type: "text_switch", watchKey: "patrol_type", watchValue: "лагерном", value: "лагерном" },
            { type: "text_switch", watchKey: "patrol_type", watchValue: "внелагерном", value: "внелагерном" },
            { type: "text", value: " патруле, дата и время — " },
            { type: "date_ddmm" },
            { type: "text", value: " | " },
            { type: "time_manual", label: "Время (ЧЧ:ММ)", placeholder: "10:00" },
            { type: "text", value: "[/u]" },
            { type: "newline" },

            { type: "text", value: "[b]Собирающий:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },

            { type: "text", value: "[b]Ведущий:[/b] " },
            { type: "other_userid", label: "Ведущий", style: "link_id" },
            { type: "newline" },

            { type: "text", value: "[b]Участники:[/b] " },
            { type: "other_userid", label: "Участники", style: "link_id", separator: ", " },
            { type: "newline" },

            { type: "text", value: "[b]Нарушители:[/b] " },
            { type: "violator_list", label: "Нарушители (ID + нарушение)" }
          ]
        },
        {
          name: "Отчёт о заплыве",
          blocks: [
            { type: "text", value: "[u]Отчёт о заплыве, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Участники заплыва:[/b] " },
            { type: "other_userid", label: "Участники", style: "link_id", separator: ", " }
          ]
        },
        {
          name: "Отчёт о дозоре",
          blocks: [
            { type: "text", value: "[u]Отчёт о дозоре, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },

            { type: "text", value: "[b]Дозорный:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },

            { type: "text", value: "[b]Время:[/b] " },
            { type: "time_manual", label: "Время начала", placeholder: "hh:mm" },
            { type: "text", value: " — " },
            { type: "time_manual", label: "Время конца", placeholder: "hh:mm" },
            { type: "text", value: " [b][" },
            { type: "time_manual", label: "Длительность (hh:mm)", placeholder: "hh:mm" },
            { type: "text", value: "][/b]" },
            { type: "newline" },

            { type: "text", value: "[b]Место дозора:[/b] " },
            {
              type: "select",
              label: "Локация",
              options: ["Заросший туннель", "Заросший туннель → Сокрытая Полянка → Тайник с Припасами → Сокрытая полянка → Заросший туннель"],
              default: "Заросший туннель"
            }
          ]
        },
          {
          name: "Отчёт о тренировке",
          blocks: [
            { type: "text", value: "[u]Отчёт о тренировке, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },

            { type: "text", value: "[b]Получено единиц:[/b] [" },
            { type: "number", label: "БУ в начале", placeholder: "число" },
            { type: "text", value: "] [" },
            { type: "url_with_text", label: "Ссылка на скриншот начала", linkText: "скриншот БУ" },
            { type: "text", value: "] – [" },
            { type: "number", label: "БУ в конце", placeholder: "число" },
            { type: "text", value: "] [" },
            { type: "url_with_text", label: "Ссылка на скриншот конца", linkText: "скриншот БУ" },
            { type: "text", value: "] [" },
            { type: "number", label: "Кол-во полученных единиц БУ", placeholder: "число" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о собрании клана",
          blocks: [
            { type: "text", value: "[u]Отчёт о собрании клана, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "[b]Присутствовали:[/b] " },
            { type: "other_userid", label: "Присутствовали", style: "link_id", separator: ", " },
            { type: "newline" },
            { type: "text", value: "[b]Новости:[/b] " },
            { type: "user_text", label: "Новости", placeholder: "..." }
          ]
        },
        {
          name: "Отчёт о посещении лекции",
          blocks: [
            { type: "text", value: "[u]Отчёт о посещении лекции, дата — " },
            { type: "date_ddmm" },
            { type: "text", value: "[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], посетил [" },
            { type: "number", label: "Кол-во лекций", placeholder: "кол-во" },
            { type: "text", value: "] лекций и узнал много нового." },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот", linkText: "скриншот из блога опекающих" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о получении жетончика",
          blocks: [
            { type: "text", value: "[u]Отчёт о получении жетончика[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], выполнил требования для получения жетончика под названием “" },
            {
              type: "select",
              label: "Название жетончика",
              options: ["Блюститель территории", "Зоркий глаз", "Прыткий ловец жучков", "Внимательный слушатель", "Юный пловец", "Храбрый малыш", "Стремящийся к обучению"],
              default: "Блюститель территории"
            },
            { type: "text", value: "”." },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот", linkText: "скриншот выполненных требований" },
            { type: "text", value: "]" }
          ]
        },
        {
          name: "Отчёт о выполнении задания",
          blocks: [
            { type: "text", value: "[u]Отчёт о выполнении задания[/u]" },
            { type: "newline" },
            { type: "text", value: "Я, [b]" },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: "[/b], выполнил задания и хочу получить украшение на свою табличку." },
            { type: "newline" },
            { type: "text", value: "[" },
            { type: "url_plain", label: "Ссылка на скриншот", linkText: "скриншот выполненного задания" },
            { type: "text", value: "]" }
          ]
        }
      ]
    },
          {
      mask: "blog783055",
      templates: [
          {
          name: "Отчёт о грушевании (Двойное)",
          blocks: [
            { type: "select", key: "is_mandatory", label: "Тип грушевания", options: ["обычное", "обязательное"], default: "обычное", silent: true },

            { type: "text", value: "[u]Отчёт " },
            { type: "text_switch", watchKey: "is_mandatory", watchValue: "обязательное", value: "об " },
            { type: "text_switch", watchKey: "is_mandatory", watchValue: "обычное", value: "о " },
            { type: "text_switch", watchKey: "is_mandatory", watchValue: "обязательное", value: "обязательном " },
            { type: "text", value: "двойном грушевании[/u]" },
            { type: "newline" },

            { type: "text", value: "[b]Груши[/b]: " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "text", value: " и " },
            { type: "other_userid", label: "Вторая груша", style: "link_id" },
            { type: "newline" },

            { type: "text", value: "[b]Кол-во часов:[/b] [" },
            { type: "time_manual", label: "Время начала", placeholder: "чч:мм" },
            { type: "text", value: "] [" },
            { type: "url_with_text", label: "Ссылка на скриншот начала", linkText: "скриншот" },
            { type: "text", value: "] — [" },
            { type: "time_manual", label: "Время конца", placeholder: "чч:мм" },
            { type: "text", value: "] [" },
            { type: "url_with_text", label: "Ссылка на скриншот конца", linkText: "скриншот" },
            { type: "text", value: "] [b][" },
            { type: "time_manual", label: "Длительность (чч:мм)", placeholder: "чч:мм" },
            { type: "text", value: "][/b]" }
          ]
        },
          {
          name: "Отчёт о грушевании (Индивидуальное)",
          blocks: [
            { type: "select", key: "is_mandatory", label: "Тип грушевания", options: ["обычное", "обязательное"], default: "обычное", silent: true },

            { type: "text", value: "[u]Отчёт " },
            { type: "text_switch", watchKey: "is_mandatory", watchValue: "обязательное", value: "об " },
            { type: "text_switch", watchKey: "is_mandatory", watchValue: "обычное", value: "о " },
            { type: "text_switch", watchKey: "is_mandatory", watchValue: "обязательное", value: "обязательном " },
            { type: "text", value: "индивидуальном грушевании[/u]" },
            { type: "newline" },

            { type: "text", value: "[b]Груша:[/b] " },
            { type: "userid", style: "link" },
            { type: "text", value: " " },
            { type: "userid", style: "id" },
            { type: "newline" },

            { type: "text", value: "[b]Кол-во часов:[/b] [" },
            { type: "time_manual", label: "Время начала", placeholder: "чч:мм" },
            { type: "text", value: "] [" },
            { type: "url_with_text", label: "Ссылка на скриншот начала", linkText: "скриншот" },
            { type: "text", value: "] — [" },
            { type: "time_manual", label: "Время конца", placeholder: "чч:мм" },
            { type: "text", value: "] [" },
            { type: "url_with_text", label: "Ссылка на скриншот конца", linkText: "скриншот" },
            { type: "text", value: "] [b][" },
            { type: "time_manual", label: "Длительность (чч:мм)", placeholder: "чч:мм" },
            { type: "text", value: "][/b]" }
          ]
        },
        {
          name: "Начало индивидуального грушевания",
          blocks: [
            { type: "text", value: "Я, " },
            { type: "userid", style: "link" },
            { type: "text", value: ", начинаю индивидуальное грушевание на локации " },
            { type: "user_text", label: "Локация", placeholder: "название локации" }
          ]
        },
        {
          name: "Запись на грушевание",
          blocks: [
            { type: "text", value: "Я, " },
            { type: "userid", style: "link" },
            { type: "text", value: ", занял время грушевания " },
            { type: "date_ddmm" },
            { type: "text", value: " с " },
            { type: "time_manual", label: "Время начала", placeholder: "чч:мм" },
            { type: "text", value: " до " },
            { type: "time_manual", label: "Время конца", placeholder: "чч:мм" },
            { type: "text", value: " на локации [b][" },
            { type: "user_text", label: "Название локации", placeholder: "локация" },
            { type: "text", value: "][/b]" }
          ]
        }
      ]
    },
   ];

  // ════════════════════════════════════════════
  //  УТИЛИТЫ
  // ════════════════════════════════════════════
  function log(...a) { if (CONFIG.DEBUG) console.log('[cw-tmpl]', ...a); }
  function warn(...a) { console.warn('[cw-tmpl]', ...a); }
  function genId(p) { return (p || 'x') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }
  function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isSafeUrl(u) {
    const x = String(u).trim().toLowerCase().replace(/&amp;/g, '&');
    return !(x.startsWith('javascript:') || x.startsWith('data:') || x.startsWith('vbscript:'));
  }

  // ════════════════════════════════════════════
  //  НАСТРОЙКИ ЦВЕТОВ
  // ════════════════════════════════════════════
  const COLORS_KEY = 'cw_tmpl_colors';
  const DEFAULT_COLORS = {
    bg: '#eeeeee',       // Фон панели и модалок
    text: '#222222',     // Цвет текста
    header: '#4a4a4a',   // Фон шапки панели
    headerText: '#ffffff',// Цвет текста в шапке
    btn: '#ffffff',      // Фон кнопок шаблонов
    btnText: '#222222',  // Цвет текста кнопок
    border: '#999999'    // Цвет рамок
  };

  function getColors() {
    try {
      const saved = JSON.parse(localStorage.getItem(COLORS_KEY));
      return Object.assign({}, DEFAULT_COLORS, saved || {});
    } catch(e) { return DEFAULT_COLORS; }
  }

  function saveColors(colors) {
    localStorage.setItem(COLORS_KEY, JSON.stringify(colors));
    applyColors();
  }

  function applyColors() {
    const c = getColors();
    let style = document.getElementById('cw-tmpl-color-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'cw-tmpl-color-style';
      document.head.appendChild(style);
    }
    style.innerHTML = `
      #cw-tmpl-ctrl { background: ${c.bg} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
      #cw-tmpl-ctrl > div:first-child { background: ${c.header} !important; color: ${c.headerText} !important; }
      #cw-tmpl-ctrl .cw-ctrl-btn { background: ${c.btn} !important; color: ${c.btnText} !important; border-color: ${c.border} !important; }
      .cw-tmpl-modal { background: ${c.bg} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
      .cw-tmpl-modal > div:first-child { background: ${c.header} !important; color: ${c.headerText} !important; }
      .cw-tmpl-modal > div:first-child b { color: ${c.headerText} !important; }
      .cw-tmpl-btnbox { background: ${c.bg} !important; border-color: ${c.border} !important; color: ${c.text} !important; }
      .cw-tmpl-btnbox input[type="button"] { background: ${c.btn} !important; color: ${c.btnText} !important; border-color: ${c.border} !important; }
    `;
  }

  // ════════════════════════════════════════════
  //  МОБИЛЬНЫЕ СТИЛИ
  // ════════════════════════════════════════════
  function injectMobileStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 768px) {
        /* Увеличиваем панель управления и делаем её шире */
        #cw-tmpl-ctrl {
          width: 100% !important;
          max-width: 100% !important;
          bottom: 0 !important;
          left: 0 !important;
          border-radius: 8px 8px 0 0 !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: none !important;
        }
        
        /* Модальное окно на весь экран */
        .cw-tmpl-modal-overlay {
          align-items: flex-end !important;
        }
        .cw-tmpl-modal {
          width: 100% !important;
          max-width: 100% !important;
          max-height: 95vh !important;
          border-radius: 12px 12px 0 0 !important;
          border-bottom: none !important;
          margin: 0 !important;
        }
        
        /* Увеличиваем поля ввода (чтобы iOS не зумил экран) */
        .cw-tmpl-modal input[type="text"],
        .cw-tmpl-modal input[type="number"],
        .cw-tmpl-modal select,
        .cw-tmpl-modal textarea {
          font-size: 16px !important;
          padding: 8px 10px !important;
          min-height: 42px !important;
          box-sizing: border-box !important;
        }

        /* Увеличиваем кнопки */
        .cw-tmpl-modal button,
        #cw-tmpl-ctrl button,
        .cw-tmpl-btnbox input[type="button"] {
          font-size: 14px !important;
          padding: 10px 14px !important;
          min-height: 44px !important; /* Удобный размер для пальца */
        }

        /* Увеличиваем чекбоксы */
        .cw-tmpl-modal input[type="checkbox"] {
          width: 22px !important;
          height: 22px !important;
        }

        /* Делаем кнопки в шапке/подвале модалки побольше и в столбик */
        .cw-tmpl-modal > div:last-child {
          flex-wrap: wrap !important;
          justify-content: center !important;
          padding-bottom: 15px !important; /* Отступ от края экрана */
        }
        
        .cw-tmpl-modal > div:last-child > div {
          flex: 1 1 100% !important;
          display: flex !important;
          justify-content: space-between !important;
        }

        /* Кнопки шаблонов над формой комментария */
        .cw-tmpl-btnbox input[type="button"] {
          width: 100% !important;
          margin: 4px 0 !important;
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ════════════════════════════════════════════
  //  ХРАНИЛИЩЕ
  // ════════════════════════════════════════════
  function migrate(raw) {
    if (!raw || typeof raw !== 'object') return { version: CONFIG.VERSION, groups: [] };
    if (!raw.version) raw.version = CONFIG.VERSION;
    if (Array.isArray(raw.groups)) {
      raw.groups.forEach(g => {
        if (!g) return;
        if (!g.id) g.id = genId('g');
        if (Array.isArray(g.templates)) {
          g.templates.forEach(t => {
            if (!t) return;
            if (!t.id && t._id) t.id = t._id;
            if (!t.id) t.id = genId('t');
            delete t._id;
          });
        }
      });
    }
    return raw;
  }

  function normalizeData(d) {
    if (!d || typeof d !== 'object') return { version: CONFIG.VERSION, groups: [] };
    if (!d.version) d.version = CONFIG.VERSION;
    if (!Array.isArray(d.groups)) d.groups = [];
    d.groups = d.groups.filter(g => g && typeof g === 'object' && typeof g.mask === 'string' && Array.isArray(g.templates));
    d.groups.forEach(g => {
      if (!g.id) g.id = genId('g');
      g.templates = g.templates.filter(t => t && typeof t === 'object' && Array.isArray(t.blocks));
      g.templates.forEach(t => { if (!t.id) t.id = genId('t'); });
    });
    return d;
  }

  function loadDataRaw() {
    try {
      const s = localStorage.getItem(KEYS.DATA);
      if (!s) return null;
      return JSON.parse(s);
    } catch(e) { return null; }
  }

  function loadData() {
    let raw = loadDataRaw();
    if (!raw) return { version: CONFIG.VERSION, groups: [] };
    raw = migrate(raw);
    raw = normalizeData(raw);
    try { localStorage.setItem(KEYS.DATA, JSON.stringify(raw)); } catch(e) {}
    return raw;
  }

  function saveData(d, opts) {
    d = normalizeData(d);
    try {
      const prev = localStorage.getItem(KEYS.DATA);
      if (prev && !(opts && opts.skipBackup)) pushBackup(prev);
    } catch(e) {}
    try { localStorage.setItem(KEYS.DATA, JSON.stringify(d)); }
    catch(e) { alert('Не удалось сохранить (localStorage переполнен?). ' + e.message); }
  }

  function pushBackup(raw) {
    try {
      const list = getBackups();
      list.unshift({ ts: Date.now(), data: raw });
      while (list.length > CONFIG.BACKUP_LIMIT) list.pop();
      localStorage.setItem(KEYS.BACKUP, JSON.stringify(list));
    } catch(e) { log('backup fail', e); }
  }

  function getBackups() {
    try { return JSON.parse(localStorage.getItem(KEYS.BACKUP)) || []; }
    catch(e) { return []; }
  }

  function applyBuiltins(force) {
    if (!Array.isArray(BUILTIN_GROUPS) || !BUILTIN_GROUPS.length) return;
    const prevVer = parseInt(localStorage.getItem(KEYS.BUILTIN_VER) || '0');
    if (!force && prevVer >= BUILTIN_VERSION) return;
    const data = loadData();
    BUILTIN_GROUPS.forEach(bg => {
      if (!bg.mask || !Array.isArray(bg.templates)) return;
      let g = data.groups.find(x => x.mask === bg.mask);
      if (!g) {
        g = { id: genId('g'), mask: bg.mask, templates: [] };
        data.groups.push(g);
      }
      bg.templates.forEach(bt => {
        if (!bt.name) return;
        const existing = g.templates.find(t => t.name === bt.name);
        if (existing) {
          existing.blocks = clone(bt.blocks || []);
          existing.builtin = true;
        } else {
          const t = clone(bt);
          t.id = genId('t');
          t.builtin = true;
          g.templates.push(t);
        }
      });
    });
    saveData(data, { skipBackup: true });
    localStorage.setItem(KEYS.BUILTIN_VER, String(BUILTIN_VERSION));
    log('builtins applied (force=' + !!force + ')');
  }

  // ════════════════════════════════════════════
  //  ИСТОРИЯ ЗНАЧЕНИЙ
  // ════════════════════════════════════════════
  function loadLastValues() {
    try { return JSON.parse(localStorage.getItem(KEYS.LAST_VALUES)) || {}; }
    catch(e) { return {}; }
  }
  function rememberValue(fieldId, value) {
    if (!value) return;
    const all = loadLastValues();
    const arr = all[fieldId] || [];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1);
    arr.unshift(value);
    while (arr.length > CONFIG.LAST_VALUES_LIMIT) arr.pop();
    all[fieldId] = arr;
    try { localStorage.setItem(KEYS.LAST_VALUES, JSON.stringify(all)); } catch(e) {}
  }
  function getLastValues(fieldId) { return loadLastValues()[fieldId] || []; }

  // ════════════════════════════════════════════
  //  ПОДСТАНОВКИ
  // ════════════════════════════════════════════
  function getMyId() {
    const p = localStorage.getItem(KEYS.MYID);
    if (p) return p;
    if (typeof my !== 'undefined' && my && my.id) return String(my.id);
    return '';
  }
  function setMyId(id) { localStorage.setItem(KEYS.MYID, id); }

  function resolveUserid(block) {
    const id = getMyId() || 'ID';
    const m = {
      id: '[' + id + ']',
      id_parens: '(' + id + ')',
      cat: '[cat' + id + ']',
      link: '[link' + id + ']',
      ulink: '[[u][[/u]link' + id + ']',
      ilink: '[[i]l[/i]ink' + id + ']'
    };
    return m[block.style] || m.id;
  }

    function resolveDate(block) {
    const n = getMskDate();
    const dd = String(n.getDate()).padStart(2, '0');
    const mm = String(n.getMonth() + 1).padStart(2, '0');
    const yy = String(n.getFullYear()).slice(-2);
    const yyyy = n.getFullYear();
    return (block.format || 'dd.mm.yy')
      .replace(/yyyy/g, yyyy).replace(/yy/g, yy)
      .replace(/dd/g, dd).replace(/mm/g, mm);
  }

  const WEEK_DAYS_RU = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
    function resolveDayOfWeek() { return WEEK_DAYS_RU[getMskDate().getDay()]; }
    function resolveTimeNow() {
    const n = getMskDate();
    return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  }

  // ════════════════════════════════════════════
  //  СТРАНИЦА
  // ════════════════════════════════════════════
  function isBlogPage() {
    const p = location.pathname;
    if (/\/blog\d+/i.test(p)) return true;
    if (/\/blog(?:\.php|\/|$)/i.test(p)) return true;
    return false;
  }

  function getTemplatesForPage() {
    const data = loadData();
    const url = document.URL;
    const result = [];
    const seen = new Set();
    data.groups.forEach(g => {
      if (g.mask && url.includes(g.mask)) {
        g.templates.forEach(t => {
          if (!seen.has(t.id)) { seen.add(t.id); result.push({ group: g, tmpl: t }); }
        });
      }
    });
    return result;
  }

  // ════════════════════════════════════════════
  //  BBCode → HTML
  // ════════════════════════════════════════════
  function bbcToHtml(text) {
    let h = escHtml(text);
    h = h.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>');
    h = h.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>');
    h = h.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
    h = h.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (m, url, txt) => {
      const decoded = url.replace(/&amp;/g, '&').toLowerCase();
      if (decoded.startsWith('javascript:') || decoded.startsWith('data:') || decoded.startsWith('vbscript:')) {
        return '<span style="color:#a33;">[небезопасная ссылка]</span>' + txt;
      }
      return '<a href="' + url + '" target="_blank" rel="noopener">' + txt + '</a>';
    });
    h = h.replace(/\[link([^\]\s]+)\]/gi, '<span style="color:#36c;">[link$1]</span>');
    h = h.replace(/\[cat([^\]\s]+)\]/gi, '<span style="color:#36c;">[cat$1]</span>');
    h = h.replace(/\n/g, '<br>');
    return h;
  }

  // ════════════════════════════════════════════
  //  РЕНДЕР ПОЛЕЙ
  // ════════════════════════════════════════════
  let __previewTick = () => {};

  function styleInput(el, nested) {
    el.style.cssText = nested
      ? 'width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box;'
      : 'width:100%;padding:2px 4px;border:1px solid #888;font-size:12px;';
  }
  function styleBtnSmall(nested) {
    return nested
      ? 'font-size:10px;padding:2px 6px;border:1px solid #a66;background:#f0d0d0;border-radius:4px;cursor:pointer;'
      : 'font-size:10px;padding:0 4px;border:1px solid #a66;background:#f0d0d0;cursor:pointer;';
  }

  function renderBlockField(block, fieldId, formData, opts) {
    opts = opts || {};
    const nested = !!opts.nested;

    const field = document.createElement('div');
    field.style.cssText = nested
      ? 'margin-bottom:8px;padding:8px;background:#f8f8f8;border-radius:4px;'
      : 'margin-bottom:6px;';

    const label = document.createElement('div');
    label.style.cssText = nested
      ? 'font-size:12px;color:#555;margin-bottom:4px;font-weight:500;'
      : 'font-size:11px;color:#555;margin-bottom:2px;';
    const setLabel = (t) => { label.textContent = t; };
    const addLabelAnd = (node) => { field.appendChild(label); field.appendChild(node); };
    const upd = () => __previewTick();

    switch (block.type) {
      case 'text': { field.style.display = 'none'; formData[fieldId] = block.value || ''; return null; }
      case 'newline': { field.style.display = 'none'; formData[fieldId] = '\n'; return null; }
      case 'text_switch': { field.style.display = 'none'; return null; }

      case 'userid': {
        setLabel('ID кота (авто):');
        const v = resolveUserid(block);
        const span = document.createElement('span');
        span.style.cssText = 'background:#e8e8e8;padding:2px 6px;border:1px solid #bbb;font-family:monospace;font-size:11px;display:inline-block;';
        span.textContent = v;
        formData[fieldId] = v;
        addLabelAnd(span);
        return field;
      }

      case 'date': {
        setLabel('Дата (авто):');
        const v = resolveDate(block);
        const span = document.createElement('span');
        span.style.cssText = 'background:#e8e8e8;padding:2px 6px;border:1px solid #bbb;font-family:monospace;font-size:11px;display:inline-block;';
        span.textContent = v;
        formData[fieldId] = v;
        addLabelAnd(span);
        return field;
      }

      case 'time_now': {
        setLabel('Время (авто):');
        const v = resolveTimeNow();
        const span = document.createElement('span');
        span.style.cssText = 'background:#e8e8e8;padding:2px 6px;border:1px solid #bbb;font-family:monospace;font-size:11px;display:inline-block;';
        span.textContent = v;
        formData[fieldId] = v;
        addLabelAnd(span);
        return field;
      }

      case 'day_of_week': {
        setLabel('День недели (авто):');
        const v = resolveDayOfWeek();
        const span = document.createElement('span');
        span.style.cssText = 'background:#e8e8e8;padding:2px 6px;border:1px solid #bbb;font-family:monospace;font-size:11px;display:inline-block;';
        span.textContent = v;
        formData[fieldId] = v;
        addLabelAnd(span);
        return field;
      }

      case 'date_ddmm': {
        const n = getMskDate();
        const dd = String(n.getDate()).padStart(2, '0');
        const mm = String(n.getMonth() + 1).padStart(2, '0');
        if ((block.dayInput || 'auto') === 'auto') {
          setLabel('Дата (ДД.ММ):');
          const span = document.createElement('span');
          span.style.cssText = 'background:#e8e8e8;padding:2px 6px;border:1px solid #bbb;font-family:monospace;font-size:11px;display:inline-block;';
          span.textContent = dd + '.' + mm;
          formData[fieldId] = dd + '.' + mm;
          addLabelAnd(span);
        } else {
          setLabel('Дата (ДД.ММ):');
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;gap:4px;align-items:center;';
          const dayInp = document.createElement('input');
          dayInp.type = 'text';
          dayInp.value = dd;
          dayInp.placeholder = 'ДД';
          dayInp.style.cssText = nested
            ? 'width:60px;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;text-align:center;'
            : 'width:50px;padding:2px 4px;border:1px solid #888;font-size:12px;text-align:center;';
          const dot = document.createElement('span');
          dot.textContent = '.' + mm;
          dot.style.cssText = 'font-family:monospace;font-size:12px;';
          dayInp.oninput = () => {
            let v = dayInp.value.replace(/\D/g, '').slice(0, 2);
            dayInp.value = v;
            formData[fieldId] = v ? (v.padStart(2, '0') + '.' + mm) : '';
            upd();
          };
          row.appendChild(dayInp);
          row.appendChild(dot);
          formData[fieldId] = dd + '.' + mm;
          addLabelAnd(row);
        }
        return field;
      }

      case 'time_hm': {
        setLabel((block.label || 'Время') + ':');
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:4px;align-items:center;';
        const hIn = document.createElement('input');
        hIn.type = 'number'; hIn.min = '0'; hIn.max = '23'; hIn.value = '0';
        hIn.style.cssText = nested
          ? 'width:60px;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;text-align:center;'
          : 'width:50px;padding:2px 4px;border:1px solid #888;font-size:12px;text-align:center;';
        const colon = document.createElement('span'); colon.textContent = ':'; colon.style.fontFamily = 'monospace';
        const mSel = document.createElement('select');
        mSel.style.cssText = nested
          ? 'padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;'
          : 'padding:2px 4px;border:1px solid #888;font-size:12px;';
        const step = Math.max(1, Math.min(30, parseInt(block.minuteStep) || 15));
        for (let m = 0; m < 60; m += step) {
          const val = String(m).padStart(2, '0');
          const o = document.createElement('option'); o.value = val; o.textContent = val; mSel.appendChild(o);
        }
        const emit = () => {
          let h = parseInt(hIn.value);
          if (isNaN(h) || h < 0) h = 0;
          if (h > 23) h = 23;
          formData[fieldId] = h + ':' + mSel.value;
          upd();
        };
        hIn.oninput = emit;
        hIn.onblur = () => { let h = parseInt(hIn.value); if (isNaN(h) || h < 0) h = 0; if (h > 23) h = 23; hIn.value = String(h); emit(); };
        mSel.onchange = emit;
        row.appendChild(hIn); row.appendChild(colon); row.appendChild(mSel);
        formData[fieldId] = '0:00';
        addLabelAnd(row);
        return field;
      }

      case 'time_manual': {
        setLabel((block.label || 'Время') + ':');
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.placeholder = block.placeholder || '13:47';
        styleInput(inp, nested);
        inp.oninput = () => { formData[fieldId] = inp.value; upd(); };
        formData[fieldId] = '';
        addLabelAnd(inp);
        return field;
      }

      case 'user_text': {
        setLabel((block.label || 'Текст') + ':');
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.placeholder = block.placeholder || 'введи текст';
        styleInput(inp, nested);
        if (block.history !== false) {
          const listId = 'dl_' + fieldId;
          const dl = document.createElement('datalist');
          dl.id = listId;
          getLastValues(fieldId).forEach(v => {
            const o = document.createElement('option'); o.value = v; dl.appendChild(o);
          });
          inp.setAttribute('list', listId);
          field.appendChild(dl);
          inp.onblur = () => { if (inp.value) rememberValue(fieldId, inp.value); };
        }
        inp.oninput = () => { formData[fieldId] = inp.value; upd(); };
        formData[fieldId] = '';
        addLabelAnd(inp);
        return field;
      }

      case 'number': {
        setLabel((block.label || 'Число') + ':');
        const inp = document.createElement('input');
        inp.type = 'number';
        if (block.min !== undefined && block.min !== '') inp.min = block.min;
        if (block.max !== undefined && block.max !== '') inp.max = block.max;
        if (block.step !== undefined && block.step !== '') inp.step = block.step;
        if (block.placeholder) inp.placeholder = block.placeholder;
        styleInput(inp, nested);
        inp.oninput = () => { formData[fieldId] = inp.value; upd(); };
        formData[fieldId] = '';
        addLabelAnd(inp);
        return field;
      }

      case 'select': {
        setLabel((block.label || 'Выбор') + ':');
        const sel = document.createElement('select');
        sel.style.cssText = nested
          ? 'width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;box-sizing:border-box;'
          : 'width:100%;padding:2px 4px;border:1px solid #888;font-size:12px;';
        const opts2 = block.options || [];
        if (!nested) {
          opts2.forEach(o => { const el = document.createElement('option'); el.value = o; el.textContent = o; sel.appendChild(el); });
          const def = block.default !== undefined && block.default !== '' ? block.default : (opts2[0] || '');
          sel.value = def;
          formData[fieldId] = def;
        } else {
          const d = document.createElement('option'); d.value = ''; d.textContent = '-- выбрать --'; sel.appendChild(d);
          opts2.forEach(o => { const el = document.createElement('option'); el.value = o; el.textContent = o; sel.appendChild(el); });
          sel.value = block.default !== undefined ? block.default : '';
          formData[fieldId] = sel.value;
        }
        sel.onchange = () => { formData[fieldId] = sel.value; upd(); };
        addLabelAnd(sel);
        return field;
      }

      case 'multiselect': {
        setLabel((block.label || 'Выбор') + ': (клик по варианту)');
        const chipsWrap = document.createElement('div');
        chipsWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;';
        const chipEls = {};
        const selected = [];
        (block.options || []).forEach(opt => {
          const chip = document.createElement('span');
          chip.style.cssText = 'padding:2px 8px;border:1px solid #888;background:#e8e8e0;cursor:pointer;font-size:11px;';
          chip.textContent = opt;
          chipEls[opt] = chip;
          chip.onclick = () => {
            const i = selected.findIndex(s => s.value === opt);
            if (i >= 0) {
              selected.splice(i, 1);
              chip.style.background = '#e8e8e0'; chip.style.borderColor = '#888';
            } else {
              selected.push({ value: opt, count: '1' });
              chip.style.background = '#c8d8c8'; chip.style.borderColor = '#5a5';
            }
            formData[fieldId] = clone(selected);
            renderSelected();
            upd();
          };
          chipsWrap.appendChild(chip);
        });
        const selLabel = document.createElement('div');
        selLabel.style.cssText = 'font-size:10px;color:#555;margin-top:4px;';
        selLabel.textContent = 'Выбрано:';
        const selList = document.createElement('div');
        selList.style.cssText = 'display:flex;flex-direction:column;gap:2px;margin-top:2px;';

        function renderSelected() {
          selList.innerHTML = '';
          if (!selected.length) selList.innerHTML = '<span style="color:#999;font-size:10px;">(пусто)</span>';
          selected.forEach((item, i) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:11px;';
            const n = document.createElement('span'); n.textContent = item.value; n.style.cssText = 'min-width:60px;';
            row.appendChild(n);
                        if (block.style !== 'text_only') {
              const c = document.createElement('input');
              c.type = 'number'; c.value = item.count; c.min = '0';
              c.style.cssText = 'width:45px;padding:1px 3px;border:1px solid #888;font-size:11px;';
              c.oninput = () => { item.count = c.value; formData[fieldId] = clone(selected); upd(); };
              row.appendChild(c);
            }
            const rm = document.createElement('button');
            rm.textContent = '×';
            rm.style.cssText = 'font-size:10px;padding:0 4px;border:1px solid #a66;background:#f0d0d0;cursor:pointer;';
            rm.onclick = () => {
              selected.splice(i, 1);
              if (chipEls[item.value]) { chipEls[item.value].style.background = '#e8e8e0'; chipEls[item.value].style.borderColor = '#888'; }
              formData[fieldId] = clone(selected); renderSelected(); upd();
            };
            row.appendChild(rm);
            selList.appendChild(row);
          });
          formData[fieldId] = clone(selected);
        }

        formData[fieldId] = [];
        field.appendChild(label);
        field.appendChild(chipsWrap);
        field.appendChild(selLabel);
        field.appendChild(selList);
        renderSelected();
        return field;
      }

      case 'select_or_number': {
        setLabel((block.label || 'Выбор или число') + ':');
        const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:4px;';
        const sel = document.createElement('select');
        sel.style.cssText = nested
          ? 'flex:1;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;'
          : 'flex:1;padding:2px 4px;border:1px solid #888;font-size:12px;';
        const d = document.createElement('option'); d.value = ''; d.textContent = '-- выбрать --'; sel.appendChild(d);
        (block.options || []).forEach(o => { const el = document.createElement('option'); el.value = o; el.textContent = o; sel.appendChild(el); });
        const n = document.createElement('input');
        n.type = 'number'; n.placeholder = 'или число';
        n.style.cssText = nested
          ? 'width:90px;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;'
          : 'width:80px;padding:2px 4px;border:1px solid #888;font-size:12px;';
        sel.onchange = () => { if (sel.value) { n.value = ''; formData[fieldId] = sel.value; } else { formData[fieldId] = n.value; } upd(); };
        n.oninput = () => { if (n.value) { sel.value = ''; formData[fieldId] = n.value; } else { formData[fieldId] = sel.value; } upd(); };
        row.appendChild(sel); row.appendChild(n);
        formData[fieldId] = '';
        addLabelAnd(row);
        return field;
      }

      case 'checkbox': {
        const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:6px;';
        const chk = document.createElement('input'); chk.type = 'checkbox'; chk.style.cursor = 'pointer';
        const lbl = document.createElement('label'); lbl.textContent = block.label || 'Чекбокс'; lbl.style.cssText = 'cursor:pointer;font-size:12px;';
        chk.onchange = () => { formData[fieldId] = chk.checked ? '1' : '0'; upd(); };
        lbl.onclick = () => { chk.checked = !chk.checked; chk.onchange(); };
        row.appendChild(chk); row.appendChild(lbl);
        formData[fieldId] = '0';
        field.appendChild(row);
        return field;
      }

      case 'checkbox_group': {
        const card = document.createElement('div');
        card.style.cssText = 'border:1px solid #ccc;border-radius:4px;margin-bottom:6px;background:#f8f8f8;overflow:hidden;';
        const head = document.createElement('div');
        head.style.cssText = 'background:#e8e8e8;padding:8px 10px;cursor:pointer;display:flex;align-items:center;gap:8px;user-select:none;';
        const chk = document.createElement('input'); chk.type = 'checkbox'; chk.style.cursor = 'pointer';
        const lbl = document.createElement('span'); lbl.textContent = block.label || 'Группа'; lbl.style.cssText = 'font-size:12px;font-weight:bold;flex:1;';
        const arrow = document.createElement('span'); arrow.textContent = '▼'; arrow.style.cssText = 'font-size:10px;color:#666;transition:transform 0.3s;';
        head.appendChild(chk); head.appendChild(lbl); head.appendChild(arrow);
        card.appendChild(head);
        const nestedWrap = document.createElement('div');
        nestedWrap.style.cssText = 'padding:10px;background:#fff;display:none;';

        const sync = () => {
          const open = chk.checked;
          formData[fieldId] = open ? '1' : '0';
          nestedWrap.style.display = open ? 'block' : 'none';
          arrow.style.transform = open ? 'rotate(180deg)' : 'rotate(0)';
          head.style.background = open ? '#d8d8d8' : '#e8e8e8';
          upd();
        };
        head.onclick = () => { chk.checked = !chk.checked; sync(); };
        chk.onclick = (e) => e.stopPropagation();
        chk.onchange = sync;

        if (Array.isArray(block.blocks)) {
          block.blocks.forEach((nb, i) => {
            const nid = fieldId + '_' + i;
            if (nb.type === 'checkbox_group') { warn('вложенный checkbox_group пропущен'); return; }
            try {
              const el = renderBlockField(nb, nid, formData, { nested: true });
              if (el) nestedWrap.appendChild(el);
            } catch(e) { warn('render nested block error', nb, e); }
          });
        }
        card.appendChild(nestedWrap);
        formData[fieldId] = '0';
        field.appendChild(card);
        return field;
      }

      case 'other_userid': {
        setLabel((block.label || 'ID другого кота') + ':');
        const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:3px;';
        const style = block.style || 'link_id';
        const hasCount = (style === 'link_id_count' || style === 'link_id_points');
        const hasCount2 = style === 'link_id_count2';
        const rows = [hasCount ? { id: '', count: '0' } : hasCount2 ? { id: '', count: '0', count2: '0' } : ''];

        function draw() {
          wrap.innerHTML = '';
          rows.forEach((item, i) => {
            const r = document.createElement('div'); r.style.cssText = 'display:flex;align-items:center;gap:4px;';
            const num = document.createElement('span'); num.textContent = '[' + (i + 1) + ']';
            num.style.cssText = 'font-size:11px;min-width:28px;font-family:monospace;color:#555;';
            r.appendChild(num);
            const inp = document.createElement('input'); inp.type = 'text';
            inp.value = (hasCount || hasCount2) ? item.id : item;
            inp.placeholder = 'ID кота';
            inp.style.cssText = nested
              ? 'flex:1;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;'
              : 'flex:1;padding:2px 4px;border:1px solid #888;font-size:12px;';
            inp.oninput = () => {
              if (hasCount || hasCount2) item.id = inp.value; else rows[i] = inp.value;
              formData[fieldId] = clone(rows); upd();
            };
            r.appendChild(inp);
            if (hasCount) {
              const c = document.createElement('input'); c.type = 'number'; c.min = '0';
              c.value = item.count || '0'; c.placeholder = 'кол-во';
              c.style.cssText = nested
                ? 'width:70px;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;'
                : 'width:60px;padding:2px 4px;border:1px solid #888;font-size:12px;';
              const norm = () => { let v = parseInt(c.value); if (isNaN(v) || v < 0) v = 0; item.count = String(v); formData[fieldId] = clone(rows); upd(); };
              c.oninput = norm; c.onchange = () => { let v = parseInt(c.value); if (isNaN(v) || v < 0) { v = 0; c.value = '0'; } item.count = String(v); formData[fieldId] = clone(rows); upd(); };
              r.appendChild(c);
            }
            if (hasCount2) {
              const c1 = document.createElement('input'); c1.type = 'number'; c1.min = '0'; c1.value = item.count || '0'; c1.placeholder = 'ун.';
              c1.style.cssText = nested
                ? 'width:60px;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;'
                : 'width:55px;padding:2px 4px;border:1px solid #888;font-size:12px;';
              c1.oninput = () => { let v = parseInt(c1.value); if (isNaN(v) || v < 0) v = 0; item.count = String(v); formData[fieldId] = clone(rows); upd(); };
              r.appendChild(c1);
              const c2 = document.createElement('input'); c2.type = 'number'; c2.min = '0'; c2.value = item.count2 || '0'; c2.placeholder = 'пойм.';
              c2.style.cssText = c1.style.cssText;
              c2.oninput = () => { let v = parseInt(c2.value); if (isNaN(v) || v < 0) v = 0; item.count2 = String(v); formData[fieldId] = clone(rows); upd(); };
              r.appendChild(c2);
            }
            if (rows.length > 1) {
              const rm = document.createElement('button'); rm.textContent = '×';
              rm.style.cssText = styleBtnSmall(nested);
              rm.onclick = () => { rows.splice(i, 1); formData[fieldId] = clone(rows); draw(); upd(); };
              r.appendChild(rm);
            }
            wrap.appendChild(r);
          });
          const add = document.createElement('button');
          add.textContent = '+ Добавить';
          add.style.cssText = nested
            ? 'font-size:11px;padding:3px 8px;border:1px solid #5a5;background:#cde8cd;border-radius:4px;cursor:pointer;align-self:flex-start;'
            : 'font-size:11px;padding:1px 8px;border:1px solid #5a5;background:#cde8cd;cursor:pointer;margin-top:2px;align-self:flex-start;';
          add.onclick = () => { rows.push(hasCount ? { id: '', count: '0' } : hasCount2 ? { id: '', count: '0', count2: '0' } : ''); draw(); };
          wrap.appendChild(add);
        }
        formData[fieldId] = clone(rows);
        draw();
        addLabelAnd(wrap);
        return field;
      }

      case 'url': {
        setLabel((block.label || 'Нум. ссылка') + ':');
        const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:3px;';
        const urls = [''];
        function draw() {
          wrap.innerHTML = '';
          urls.forEach((u, i) => {
            const r = document.createElement('div'); r.style.cssText = 'display:flex;align-items:center;gap:4px;';
            const n = document.createElement('span'); n.textContent = '[' + (i + 1) + ']';
            n.style.cssText = 'font-size:11px;min-width:28px;font-family:monospace;color:#555;';
            r.appendChild(n);
            const inp = document.createElement('input'); inp.type = 'text'; inp.value = u; inp.placeholder = 'url';
            inp.style.cssText = nested
              ? 'flex:1;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;'
              : 'flex:1;padding:2px 4px;border:1px solid #888;font-size:12px;';
            inp.oninput = () => { urls[i] = inp.value; formData[fieldId] = clone(urls); upd(); };
            r.appendChild(inp);
            if (urls.length > 1) {
              const rm = document.createElement('button'); rm.textContent = '×'; rm.style.cssText = styleBtnSmall(nested);
              rm.onclick = () => { urls.splice(i, 1); formData[fieldId] = clone(urls); draw(); upd(); };
              r.appendChild(rm);
            }
            wrap.appendChild(r);
          });
          const add = document.createElement('button');
          add.textContent = '+ Ещё ссылку';
          add.style.cssText = nested
            ? 'font-size:11px;padding:3px 8px;border:1px solid #5a5;background:#cde8cd;border-radius:4px;cursor:pointer;align-self:flex-start;'
            : 'font-size:11px;padding:1px 8px;border:1px solid #5a5;background:#cde8cd;cursor:pointer;margin-top:2px;align-self:flex-start;';
          add.onclick = () => { urls.push(''); draw(); };
          wrap.appendChild(add);
        }
        formData[fieldId] = [''];
        draw();
        addLabelAnd(wrap);
        return field;
      }

      case 'url_plain': {
        setLabel((block.label || 'Ссылка') + ':');
        const inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = 'url';
        styleInput(inp, nested);
        inp.oninput = () => { formData[fieldId] = inp.value; upd(); };
        formData[fieldId] = '';
        addLabelAnd(inp);
        return field;
      }

      case 'url_with_text': {
        setLabel((block.label || 'Ссылка + текст') + ':');
        const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:3px;';
        const urlInp = document.createElement('input'); urlInp.type = 'text'; urlInp.placeholder = 'url';
        styleInput(urlInp, nested);
        const txtInp = document.createElement('input'); txtInp.type = 'text'; txtInp.placeholder = 'текст ссылки';
        txtInp.value = block.linkText || '';
        styleInput(txtInp, nested);
        const emit = () => { formData[fieldId] = { url: urlInp.value, text: txtInp.value }; upd(); };
        urlInp.oninput = emit; txtInp.oninput = emit;
        wrap.appendChild(urlInp); wrap.appendChild(txtInp);
        formData[fieldId] = { url: '', text: block.linkText || '' };
        addLabelAnd(wrap);
        return field;
      }

      case 'resource_counts': {
        setLabel((block.label || 'Ресурсы') + ':');
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
        const data = {};
        (block.options || []).forEach(opt => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:6px;';
          const lbl = document.createElement('span');
          lbl.textContent = opt + ':';
          lbl.style.cssText = 'font-size:11px;color:#555;min-width:120px;';
          const inp = document.createElement('input');
          inp.type = 'number';
          inp.placeholder = '0';
          inp.style.cssText = nested
            ? 'flex:1;padding:4px 6px;border:1px solid #ccc;border-radius:4px;font-size:12px;'
            : 'flex:1;padding:2px 4px;border:1px solid #888;font-size:12px;';
          inp.oninput = () => {
            data[opt] = inp.value;
            formData[fieldId] = clone(data);
            upd();
          };
          row.appendChild(lbl);
          row.appendChild(inp);
          wrap.appendChild(row);
        });
        formData[fieldId] = {};
        addLabelAnd(wrap);
        return field;
      }
                  case 'taken_list': {
        setLabel((block.label || 'Список унесённых') + ':');
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
        const items = [{ found: '', loc: '', carrier: '' }];

        function draw() {
          wrap.innerHTML = '';
          items.forEach((item, i) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:4px;';

            const f = document.createElement('input');
            f.type = 'text'; f.value = item.found; f.placeholder = 'ID найденного';
            f.style.cssText = 'width:80px;padding:2px 4px;border:1px solid #888;font-size:12px;';
            f.oninput = () => { item.found = f.value; formData[fieldId] = clone(items); upd(); };

            const l = document.createElement('input');
            l.type = 'text'; l.value = item.loc; l.placeholder = 'Локация';
            l.style.cssText = 'flex:1;padding:2px 4px;border:1px solid #888;font-size:12px;';
            l.oninput = () => { item.loc = l.value; formData[fieldId] = clone(items); upd(); };

            const c = document.createElement('input');
            c.type = 'text'; c.value = item.carrier; c.placeholder = 'ID унёсшего';
            c.style.cssText = 'width:90px;padding:2px 4px;border:1px solid #888;font-size:12px;';
            c.oninput = () => { item.carrier = c.value; formData[fieldId] = clone(items); upd(); };

            row.appendChild(f); row.appendChild(l); row.appendChild(c);

            if (items.length > 1) {
              const rm = document.createElement('button'); rm.textContent = '×';
              rm.style.cssText = 'font-size:10px;padding:0 4px;border:1px solid #a66;background:#f0d0d0;cursor:pointer;';
              rm.onclick = () => { items.splice(i, 1); formData[fieldId] = clone(items); draw(); upd(); };
              row.appendChild(rm);
            }
            wrap.appendChild(row);
          });
          const add = document.createElement('button');
          add.textContent = '+ Добавить';
          add.style.cssText = 'font-size:11px;padding:1px 8px;border:1px solid #5a5;background:#cde8cd;cursor:pointer;margin-top:2px;align-self:flex-start;';
          add.onclick = () => { items.push({ found: '', loc: '', carrier: '' }); draw(); };
          wrap.appendChild(add);
        }
        formData[fieldId] = clone(items);
        draw();
        addLabelAnd(wrap);
        return field;
      }
                  case 'violator_list': {
        setLabel((block.label || 'Нарушители') + ':');
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
        const items = [{ id: '', violation: '' }];

        function draw() {
          wrap.innerHTML = '';
          items.forEach((item, i) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:4px;';

            const idInp = document.createElement('input');
            idInp.type = 'text'; idInp.value = item.id; idInp.placeholder = 'ID';
            idInp.style.cssText = 'width:80px;padding:2px 4px;border:1px solid #888;font-size:12px;';
            idInp.oninput = () => { item.id = idInp.value; formData[fieldId] = clone(items); upd(); };

            const vioInp = document.createElement('input');
            vioInp.type = 'text'; vioInp.value = item.violation; vioInp.placeholder = 'Нарушение';
            vioInp.style.cssText = 'flex:1;padding:2px 4px;border:1px solid #888;font-size:12px;';
            vioInp.oninput = () => { item.violation = vioInp.value; formData[fieldId] = clone(items); upd(); };

            row.appendChild(idInp); row.appendChild(vioInp);

            if (items.length > 1) {
              const rm = document.createElement('button'); rm.textContent = '×';
              rm.style.cssText = 'font-size:10px;padding:0 4px;border:1px solid #a66;background:#f0d0d0;cursor:pointer;';
              rm.onclick = () => { items.splice(i, 1); formData[fieldId] = clone(items); draw(); upd(); };
              row.appendChild(rm);
            }
            wrap.appendChild(row);
          });
          const add = document.createElement('button');
          add.textContent = '+ Добавить';
          add.style.cssText = 'font-size:11px;padding:1px 8px;border:1px solid #5a5;background:#cde8cd;cursor:pointer;margin-top:2px;align-self:flex-start;';
          add.onclick = () => { items.push({ id: '', violation: '' }); draw(); };
          wrap.appendChild(add);
        }
        formData[fieldId] = clone(items);
        draw();
        addLabelAnd(wrap);
        return field;
      }

      default:
        return null;
    }
  }

  // ════════════════════════════════════════════
  //  ГЕНЕРАЦИЯ ТЕКСТА
  // ════════════════════════════════════════════
  function applyBiu(val, block) {
    if (val === '' || val === null || val === undefined) return val;
    if (block.bold) val = '[b]' + val + '[/b]';
    if (block.italic) val = '[i]' + val + '[/i]';
    if (block.underline) val = '[u]' + val + '[/u]';
    return val;
  }

  function fmtOther(style, id, count, count2) {
    switch (style) {
      case 'id': return '[' + id + ']';
      case 'link': return '[link' + id + ']';
      case 'ulink': return '[[u][[/u]link' + id + ']';
      case 'ilink': return '[[i]l[/i]ink' + id + ']';
      case 'b_link': return '[b][link' + id + '][/b]';
      case 'link_id': return '[link' + id + '] [' + id + ']';
      case 'ulink_id': return '[[u][[/u]link' + id + '] [' + id + ']';
      case 'link_id_parens': return '[link' + id + '] (' + id + ')';
      case 'link_id_count': return '[link' + id + '] [' + id + '] - ' + count;
      case 'link_id_points': return '[link' + id + '] [' + id + '] [' + count + ']';
      case 'link_id_count2': return '[link' + id + '] [' + id + '] - ' + count + '/' + count2;
      default: return '[b][link' + id + '][/b]';
    }
  }

  function generateOther(block, items) {
    const style = block.style || 'link_id';
    const sep = block.separator !== undefined && block.separator !== null ? block.separator : ', ';
    const hasCount = (style === 'link_id_count' || style === 'link_id_points');
    const hasCount2 = style === 'link_id_count2';
    const filtered = (items || []).filter(it => {
      if (hasCount || hasCount2) return it && it.id;
      return it;
    });
    return filtered.map(it => {
      if (hasCount || hasCount2) return fmtOther(style, it.id, it.count || '0', it.count2 || '0');
      return fmtOther(style, it, '0', '0');
    }).join(sep);
  }

  function generateNested(nb, fid, fd) {
    switch (nb.type) {
      case 'text': return applyBiu(fd[fid] || '', nb);
      case 'number': { let v = fd[fid] || ''; if (nb.style === 'brackets' && v) v = '[' + v + ']'; return applyBiu(v, nb); }
      case 'userid': return applyBiu(fd[fid] || '', nb);
      case 'other_userid': return applyBiu(generateOther(nb, fd[fid] || []), nb);
      case 'date': return applyBiu(fd[fid] || '', nb);
      case 'date_ddmm': return applyBiu(fd[fid] || '', nb);
      case 'time_hm': return applyBiu(fd[fid] || '', nb);
      case 'time_manual': return applyBiu(fd[fid] || '', nb);
      case 'time_now': return applyBiu(fd[fid] || '', nb);
      case 'day_of_week': return applyBiu(fd[fid] || '', nb);
      case 'user_text': return applyBiu(fd[fid] || '', nb);
      case 'select': return applyBiu(fd[fid] || '', nb);
      case 'select_or_number': return applyBiu(fd[fid] || '', nb);
      case 'checkbox': return fd[fid] === '1' ? applyBiu(nb.text || '', nb) : '';
      case 'newline': return '\n';
            case 'multiselect': {
        const items = (fd[fid] || []).filter(i => { const c = parseInt(i.count); return !isNaN(c) && c > 0; });
        return applyBiu(items.map(i => nb.style === 'text_only' ? i.value : (i.value + ' [' + i.count + ']')).join(nb.separator || ', '), nb);
      }
      case 'url': {
        const urls = (fd[fid] || []).filter(u => u);
        if (!urls.length) return '';
        return urls.map((u, i) => isSafeUrl(u) ? ('[url=' + u + ']' + (nb.linkText || '') + '[' + (i + 1) + '][/url]') : '').join(' ');
      }
            case 'url_plain': {
        const u = fd[fid] || '';
        if (u && isSafeUrl(u)) return (nb.prefix || '') + '[url=' + u + ']' + (nb.linkText || '') + '[/url]' + (nb.suffix || '');
        return '';
      }
      case 'url_with_text': {
        const v = fd[fid] || {};
        if (v.url && isSafeUrl(v.url)) return (nb.prefix || '') + '[url=' + v.url + ']' + (v.text || 'ссылка') + '[/url]' + (nb.suffix || '');
        return '';
      }
      case 'resource_counts': {
        const data = fd[fid] || {};
        const parts = [];
        (nb.options || []).forEach(opt => {
          const val = data[opt];
          if (val && parseInt(val) > 0) {
            parts.push(opt + ' [' + val + ']');
          }
        });
        return applyBiu(parts.join(nb.separator || ', '), nb);
      }
        case 'taken_list': {
        const items = (fd[fid] || []).filter(i => i.found && i.carrier);
        const res = items.length > 0 ? items.map(i => `[link${i.found}] — ${i.loc} ([link${i.carrier}] [${i.carrier}])`).join(', ') : '—';
        return applyBiu(res, nb);
      }
        case 'violator_list': {
        const valid = (fd[fid] || []).filter(x => x.id);
        return valid.length ? applyBiu(valid.map(x => `[link${x.id}] [${x.id}] – ${x.violation}`).join(', '), nb) : '—';
      }
      default: return '';
    }
  }

  function generateText(blocks, fd) {
    let out = '';
    const keyMap = {};
    (blocks || []).forEach((b, i) => {
      if (b && b.key) keyMap[b.key] = 'cw_f_' + i;
    });
    (blocks || []).forEach((b, i) => {
      const fid = 'cw_f_' + i;
      try {
        switch (b.type) {
          case 'text': out += applyBiu(b.value || '', b); break;
          case 'newline': out += '\n'; break;
          case 'text_switch': {
            const watchedFid = b.watchKey ? keyMap[b.watchKey] : null;
            const state = watchedFid ? fd[watchedFid] : '0';
            let on;
            if (b.watchValue !== undefined) {
              on = (state === b.watchValue);
            } else {
              on = (state === '1');
            }
            if (b.invert) on = !on;
            out += applyBiu(on ? (b.value || '') : (b.altValue || ''), b);
            break;
          }
          case 'userid': out += applyBiu(resolveUserid(b), b); break;
          case 'date': out += applyBiu(resolveDate(b), b); break;
          case 'time_now': out += applyBiu(resolveTimeNow(), b); break;
          case 'day_of_week': out += applyBiu(resolveDayOfWeek(), b); break;
          case 'date_ddmm': out += applyBiu(fd[fid] || '', b); break;
          case 'time_hm': out += applyBiu(fd[fid] || '', b); break;
          case 'time_manual': out += applyBiu(fd[fid] || '', b); break;
          case 'user_text': out += applyBiu(fd[fid] || '', b); break;
          case 'select_or_number': out += applyBiu(fd[fid] || '', b); break;
          case 'select': if (!b.silent) out += applyBiu(fd[fid] || '', b); break;
          case 'checkbox': if (fd[fid] === '1') out += applyBiu(b.text || '', b); break;
                    case 'multiselect': {
            const items = (fd[fid] || []).filter(x => { const c = parseInt(x.count); return !isNaN(c) && c > 0; });
            out += applyBiu(items.map(x => b.style === 'text_only' ? x.value : (x.value + ' [' + x.count + ']')).join(b.separator || ', '), b);
            break;
          }
          case 'number': { let v = fd[fid] || ''; if (b.style === 'brackets' && v) v = '[' + v + ']'; out += applyBiu(v, b); break; }
          case 'other_userid': out += applyBiu(generateOther(b, fd[fid] || []), b); break;
          case 'url': {
            const urls = (fd[fid] || []).filter(u => u);
            if (!urls.length) break;
            out += urls.map((u, i) => isSafeUrl(u) ? ('[url=' + u + ']' + (b.linkText || '') + '[' + (i + 1) + '][/url]') : '').join(' ');
            break;
          }
             case 'url_plain': {
            const u = fd[fid] || '';
            if (u && isSafeUrl(u)) out += (b.prefix || '') + '[url=' + u + ']' + (b.linkText || '') + '[/url]' + (b.suffix || '');
            break;
          }
          case 'url_with_text': {
            const v = fd[fid] || {};
            if (v.url && isSafeUrl(v.url)) out += (b.prefix || '') + '[url=' + v.url + ']' + (v.text || 'ссылка') + '[/url]' + (b.suffix || '');
            break;
          }
          case 'resource_counts': {
            const data = fd[fid] || {};
            const parts = [];
            (b.options || []).forEach(opt => {
              const val = data[opt];
              if (val && parseInt(val) > 0) {
                parts.push(opt + ' [' + val + ']');
              }
            });
            out += applyBiu(parts.join(b.separator || ', '), b);
            break;
          }
            case 'taken_list': {
            const items = (fd[fid] || []).filter(i => i.found && i.carrier);
            const res = items.length > 0 ? items.map(i => `[link${i.found}] — ${i.loc} ([link${i.carrier}] [${i.carrier}])`).join(', ') : '—';
            out += applyBiu(res, b);
            break;
          }
            case 'violator_list': {
            const valid = (fd[fid] || []).filter(x => x.id);
            out += applyBiu(valid.length ? valid.map(x => `[link${x.id}] [${x.id}] – ${x.violation}`).join(', ') : '—', b);
            break;
          }
          case 'checkbox_group':
            if (fd[fid] === '1' && Array.isArray(b.blocks)) {
              b.blocks.forEach((nb, j) => {
                if (nb.type === 'checkbox_group') return;
                out += generateNested(nb, fid + '_' + j, fd);
              });
            }
            break;
        }
      } catch(e) { warn('generate error', b, e); }
    });
    return out;
  }

  // ════════════════════════════════════════════
  //  ВСТАВКА / КОПИРОВАНИЕ
  // ════════════════════════════════════════════
  function insertAtCursor(textarea, text) {
    const s = textarea.selectionStart, e = textarea.selectionEnd;
    textarea.value = textarea.value.substring(0, s) + text + textarea.value.substring(e);
    textarea.selectionStart = textarea.selectionEnd = s + text.length;
    textarea.focus();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
    } catch(e) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove(); return ok;
    } catch(e) { return false; }
  }

  // ════════════════════════════════════════════
  //  МОДАЛКА ЗАПОЛНЕНИЯ
  // ════════════════════════════════════════════
  function openTemplateModal(tmpl, textarea) {
    let dirty = false;
    const overlay = document.createElement('div');
    overlay.className = 'cw-tmpl-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99999;display:flex;align-items:center;justify-content:center;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:#f0f0eb;border:1px solid #888;max-width:560px;width:92%;max-height:85vh;display:flex;flex-direction:column;font-family:Verdana,Arial,sans-serif;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,0.3);';

    const head = document.createElement('div');
    head.style.cssText = 'background:#ddd;padding:6px 10px;border-bottom:1px solid #888;display:flex;justify-content:space-between;align-items:center;';
    head.innerHTML = '<b style="font-size:13px;">' + escHtml(tmpl.name) + '</b>';

    let closed = false;
    const cleanup = () => {
      if (closed) return;
      closed = true;
      overlay.remove();
      document.removeEventListener('keydown', keyHandler);
      __previewTick = () => {};
    };
    const tryClose = () => {
      if (dirty && !confirm('Форма заполнена. Закрыть без вставки?')) return;
      cleanup();
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:14px;padding:0 4px;';
    closeBtn.onclick = tryClose;
    head.appendChild(closeBtn);
    modal.appendChild(head);

    const body = document.createElement('div');
    body.style.cssText = 'padding:10px;overflow-y:auto;flex:1;';

    const formData = {};
    (tmpl.blocks || []).forEach((b, i) => {
      try {
        const el = renderBlockField(b, 'cw_f_' + i, formData, { nested: false });
        if (el) body.appendChild(el);
      } catch(e) { warn('render block error', b, e); }
    });

    body.addEventListener('input', () => { dirty = true; });
    body.addEventListener('change', () => { dirty = true; });

    const pvLabel = document.createElement('div');
    pvLabel.style.cssText = 'font-size:11px;color:#555;margin-top:8px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;';
    const pvTitle = document.createElement('span'); pvTitle.textContent = 'Предпросмотр (BBCode):';
    const pvTools = document.createElement('span');
    const renderToggle = document.createElement('button');
    renderToggle.textContent = '👁 Рендер';
    renderToggle.style.cssText = 'font-size:10px;padding:1px 8px;border:1px solid #888;background:#e0e0e0;cursor:pointer;margin-left:4px;';
    pvTools.appendChild(renderToggle);
    pvLabel.appendChild(pvTitle); pvLabel.appendChild(pvTools);
    body.appendChild(pvLabel);

    const preview = document.createElement('div');
    preview.style.cssText = 'border:1px dashed #aaa;background:#f8f8f5;padding:6px;font-family:monospace;font-size:11px;white-space:pre-wrap;word-break:break-word;min-height:30px;max-height:200px;overflow-y:auto;';
    body.appendChild(preview);
    let renderMode = false;
    renderToggle.onclick = () => {
      renderMode = !renderMode;
      renderToggle.textContent = renderMode ? '📝 BBCode' : '👁 Рендер';
      pvTitle.textContent = renderMode ? 'Предпросмотр (рендер):' : 'Предпросмотр (BBCode):';
      updatePreview();
    };

    modal.appendChild(body);

    const foot = document.createElement('div');
    foot.style.cssText = 'padding:8px 10px;border-top:1px solid #888;background:#e8e8e5;display:flex;gap:6px;justify-content:space-between;';

    const left = document.createElement('div');
    left.style.cssText = 'display:flex;gap:6px;';
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Удалить шаблон';
    delBtn.style.cssText = 'padding:3px 10px;border:1px solid #a66;background:#f0d0d0;cursor:pointer;font-size:12px;font-family:Verdana,Arial,sans-serif;';
    delBtn.onclick = () => {
      if (!confirm('Удалить шаблон "' + tmpl.name + '"?')) return;
      const data = loadData();
      let removed = false;
      data.groups.forEach(g => {
        const before = g.templates.length;
        g.templates = g.templates.filter(t => t.id !== tmpl.id);
        if (g.templates.length !== before) removed = true;
      });
      data.groups = data.groups.filter(g => g.templates.length > 0);
      saveData(data);
      cleanup();
      if (removed) location.reload();
    };
    left.appendChild(delBtn);

    const right = document.createElement('div');
    right.style.cssText = 'display:flex;gap:6px;';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Копировать';
    copyBtn.style.cssText = 'padding:3px 10px;border:1px solid #888;background:#e8e8e8;cursor:pointer;font-size:12px;font-family:Verdana,Arial,sans-serif;';
    copyBtn.onclick = async () => {
      const text = generateText(tmpl.blocks, formData);
      const ok = await copyText(text);
      if (ok) { copyBtn.textContent = '✓ Скопировано'; setTimeout(() => { copyBtn.textContent = 'Копировать'; }, 1200); }
      else alert('Не удалось скопировать.');
    };
    right.appendChild(copyBtn);

    const insBtn = document.createElement('button');
    insBtn.textContent = 'Вставить (Ctrl+Enter)';
    insBtn.style.cssText = 'padding:3px 14px;border:1px solid #5a5;background:#cde8cd;cursor:pointer;font-size:12px;font-family:Verdana,Arial,sans-serif;';
    insBtn.onclick = () => {
      const text = generateText(tmpl.blocks, formData);
      insertAtCursor(textarea, text);
      dirty = false;
      cleanup();
    };
    right.appendChild(insBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Отмена';
    cancelBtn.style.cssText = 'padding:3px 10px;border:1px solid #888;background:#ddd;cursor:pointer;font-size:12px;font-family:Verdana,Arial,sans-serif;';
    cancelBtn.onclick = tryClose;
    right.appendChild(cancelBtn);

    foot.appendChild(left); foot.appendChild(right);
    modal.appendChild(foot);
    overlay.appendChild(modal);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) tryClose(); });

    const keyHandler = (e) => {
      if (e.key === 'Escape') tryClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); insBtn.onclick(); }
    };
    document.addEventListener('keydown', keyHandler);

    document.body.appendChild(overlay);

    function updatePreview() {
      const text = generateText(tmpl.blocks, formData);
      if (renderMode) preview.innerHTML = bbcToHtml(text);
      else preview.textContent = text;
    }
    __previewTick = updatePreview;
    updatePreview();

    setTimeout(() => {
      const first = body.querySelector('input,select,textarea');
      if (first) first.focus();
    }, 80);
  }

  // ════════════════════════════════════════════
  //  СХЕМЫ БЛОКОВ
  // ════════════════════════════════════════════
  const BLOCK_SCHEMAS = {
    text:              { title: 'Текст',               defaults: { value: '' } },
    newline:           { title: 'Перенос строки',      defaults: {} },
    text_switch:       { title: 'Текст-переключатель', defaults: { watchKey: '', watchValue: '', value: '', altValue: '', invert: false } },
    userid:            { title: 'Мой ID',              defaults: { style: 'id' }, styleOptions: ['id','id_parens','cat','link','ulink','ilink'] },
    other_userid:      { title: 'Список ID',           defaults: { label: 'ID', style: 'link_id', separator: ', ' }, styleOptions: ['id','link','ulink','ilink','b_link','link_id','ulink_id','link_id_parens','link_id_count','link_id_count2'] },
    date:              { title: 'Дата',                defaults: { format: 'dd.mm.yy' } },
    date_ddmm:         { title: 'Дата ДД.ММ',          defaults: { dayInput: 'auto' } },
    time_hm:           { title: 'Время ЧЧ:ММ',         defaults: { label: 'Время', minuteStep: 15 } },
    time_manual:       { title: 'Время (текст)',       defaults: { label: 'Время', placeholder: '13:47' } },
    time_now:          { title: 'Текущее время',       defaults: {} },
    day_of_week:       { title: 'День недели',         defaults: {} },
    user_text:         { title: 'Поле ввода',          defaults: { label: 'Текст', placeholder: '', history: true } },
    number:            { title: 'Число',               defaults: { label: 'Число', placeholder: '', min: '', max: '', step: '' } },
    select:            { title: 'Выпадающий список',   defaults: { label: 'Выбор', options: [], default: '', silent: false } },
    select_or_number:  { title: 'Список или число',    defaults: { label: 'Выбор', options: [] } },
    multiselect:       { title: 'Мультивыбор',         defaults: { label: 'Выбор', options: [], separator: ', ' } },
    checkbox:          { title: 'Чекбокс',             defaults: { label: 'Галочка', text: '', key: '' } },
    checkbox_group:    { title: 'Группа',              defaults: { label: 'Группа', key: '' } },
    url:               { title: 'Ссылки (нумер.)',     defaults: { label: 'Ссылки', linkText: '' } },
    url_plain:         { title: 'Ссылка',              defaults: { label: 'Ссылка', linkText: '' } },
    url_with_text:     { title: 'Ссылка + текст',      defaults: { label: 'Ссылка' } },
    resource_counts:   { title: 'Список ресурсов',     defaults: { label: 'Ресурсы', options: [], separator: ', ' } },
    other_userid:      { title: 'Список ID',           defaults: { label: 'ID', style: 'link_id', separator: ', ' }, styleOptions: ['id','link','ulink','ilink','b_link','link_id','ulink_id','link_id_parens','link_id_count','link_id_count2','link_id_points'] },
    taken_list:        { title: 'Список унесённых',    defaults: { label: 'Список унесённых' } },
    violator_list:     { title: 'Список нарушителей',  defaults: { label: 'Нарушители' } }
  };

  function createBlock(type) {
    const schema = BLOCK_SCHEMAS[type];
    if (!schema) return null;
    const b = Object.assign({ type }, clone(schema.defaults));
    if (type === 'checkbox_group') b.blocks = [];
    return b;
  }

  function summarizeBlock(b) {
    switch (b.type) {
      case 'text': return b.value ? '«' + String(b.value).slice(0, 40) + (b.value.length > 40 ? '…' : '') + '»' : '(пусто)';
      case 'newline': return '↵';
      case 'text_switch': return 'Текст: ' + (b.value || '?') + ' / ' + (b.altValue || '?') + ' (по «' + (b.watchKey || '?') + '»)';
      case 'userid': return 'ID [' + (b.style || 'id') + ']';
      case 'other_userid': return 'Список ID [' + (b.style || 'link_id') + ']';
      case 'date': return 'Дата ' + (b.format || 'dd.mm.yy');
      case 'date_ddmm': return 'Дата ДД.ММ';
      case 'time_hm': return 'Время (шаг ' + (b.minuteStep || 15) + ')';
      case 'time_manual': return 'Время вручную';
      case 'time_now': return 'Время (текущее)';
      case 'day_of_week': return 'День недели';
      case 'user_text': return 'Поле: ' + (b.label || '');
      case 'number': return 'Число: ' + (b.label || '');
      case 'select': return 'Список: ' + ((b.options || []).join(' / ').slice(0, 40) || '(пусто)') + (b.silent ? ' (тихий)' : '');
      case 'select_or_number': return 'Список/число: ' + ((b.options || []).join(' / ').slice(0, 30) || '');
      case 'multiselect': return 'Мультивыбор: ' + ((b.options || []).length) + ' вар.';
      case 'checkbox': return 'Чекбокс: ' + (b.label || '') + (b.key ? ' [key=' + b.key + ']' : '');
      case 'checkbox_group': return 'Группа: ' + (b.label || '') + ' (' + ((b.blocks || []).length) + ' влож.)' + (b.key ? ' [key=' + b.key + ']' : '');
      case 'url': return 'Ссылки';
      case 'url_plain': return 'Ссылка';
      case 'url_with_text': return 'Ссылка + текст';
      case 'resource_counts': return 'Ресурсы: ' + (b.options || []).join(', ');
      default: return b.type;
    }
  }

  function renderBlockProps(block, onChange) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:6px;border-top:1px dashed #ccc;margin-top:4px;';

    const addRow = (labelText, el) => {
      const row = document.createElement('div');
      row.style.cssText = 'margin-bottom:4px;display:flex;gap:6px;align-items:center;';
      const lbl = document.createElement('span');
      lbl.textContent = labelText;
      lbl.style.cssText = 'font-size:11px;color:#555;min-width:110px;';
      row.appendChild(lbl); row.appendChild(el);
      wrap.appendChild(row);
    };
    const textInput = (val, onInput, ph) => {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = val || '';
      if (ph) inp.placeholder = ph;
      inp.style.cssText = 'flex:1;padding:2px 4px;font-size:11px;border:1px solid #888;';
      inp.oninput = () => onInput(inp.value);
      return inp;
    };
    const boolRow = (labelText, value, onSet) => {
      const lbl = document.createElement('label');
      lbl.style.cssText = 'font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:3px;margin-right:8px;';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = !!value;
      chk.onchange = () => onSet(chk.checked);
      lbl.appendChild(chk);
      lbl.appendChild(document.createTextNode(labelText));
      return lbl;
    };

    const fmtWrap = document.createElement('div');
    fmtWrap.style.cssText = 'display:flex;flex-wrap:wrap;margin-bottom:4px;';
    fmtWrap.appendChild(boolRow('B', block.bold, v => { block.bold = v; onChange(); }));
    fmtWrap.appendChild(boolRow('I', block.italic, v => { block.italic = v; onChange(); }));
    fmtWrap.appendChild(boolRow('U', block.underline, v => { block.underline = v; onChange(); }));
    addRow('Формат:', fmtWrap);

    switch (block.type) {
      case 'text':
        addRow('Текст:', (() => {
          const ta = document.createElement('textarea');
          ta.value = block.value || '';
          ta.style.cssText = 'flex:1;padding:2px 4px;font-size:11px;min-height:44px;resize:vertical;border:1px solid #888;';
          ta.oninput = () => { block.value = ta.value; onChange(); };
          return ta;
        })());
        break;
      case 'text_switch':
        addRow('Ключ слежения:', textInput(block.watchKey, v => { block.watchKey = v; onChange(); }, 'например prob_type'));
        addRow('Значение ключа:', textInput(block.watchValue, v => { block.watchValue = v; onChange(); }, 'например ПВОП'));
        addRow('Текст (совпало):', textInput(block.value, v => { block.value = v; onChange(); }));
        addRow('Текст (не совпало):', textInput(block.altValue, v => { block.altValue = v; onChange(); }));
        (() => { const lbl = boolRow('Инвертировать', block.invert, v => { block.invert = v; onChange(); }); wrap.appendChild(lbl); })();
        break;
      case 'userid':
      case 'other_userid': {
        const schema = BLOCK_SCHEMAS[block.type];
        if (block.type === 'other_userid') addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        const sel = document.createElement('select');
        sel.style.cssText = 'padding:2px 4px;font-size:11px;';
        schema.styleOptions.forEach(o => { const el = document.createElement('option'); el.value = o; el.textContent = o; sel.appendChild(el); });
        sel.value = block.style || schema.defaults.style;
        sel.onchange = () => { block.style = sel.value; onChange(); };
        addRow('Стиль:', sel);
        if (block.type === 'other_userid') addRow('Разделитель:', textInput(block.separator, v => { block.separator = v; onChange(); }, ', '));
        break;
      }
      case 'date':
        addRow('Формат:', textInput(block.format, v => { block.format = v; onChange(); }, 'dd.mm.yy'));
        break;
      case 'date_ddmm': {
        const sel = document.createElement('select');
        sel.style.cssText = 'padding:2px 4px;font-size:11px;';
        ['auto', 'manual'].forEach(o => { const el = document.createElement('option'); el.value = o; el.textContent = o; sel.appendChild(el); });
        sel.value = block.dayInput || 'auto';
        sel.onchange = () => { block.dayInput = sel.value; onChange(); };
        addRow('Режим:', sel);
        break;
      }
      case 'time_hm':
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        addRow('Шаг минут:', (() => {
          const n = document.createElement('input'); n.type = 'number'; n.min = '1'; n.max = '30'; n.value = block.minuteStep || 15;
          n.style.cssText = 'width:80px;padding:2px 4px;font-size:11px;';
          n.oninput = () => { let v = parseInt(n.value); if (isNaN(v)) v = 15; block.minuteStep = Math.max(1, Math.min(30, v)); onChange(); };
          return n;
        })());
        break;
      case 'time_manual':
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        addRow('Placeholder:', textInput(block.placeholder, v => { block.placeholder = v; onChange(); }, '13:47'));
        break;
      case 'user_text':
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        addRow('Placeholder:', textInput(block.placeholder, v => { block.placeholder = v; onChange(); }));
        (() => { const lbl = boolRow('Запоминать последние значения', block.history !== false, v => { block.history = v; onChange(); }); wrap.appendChild(lbl); })();
        break;
      case 'number':
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        addRow('Placeholder:', textInput(block.placeholder, v => { block.placeholder = v; onChange(); }));
        addRow('Min:', textInput(block.min, v => { block.min = v; onChange(); }));
        addRow('Max:', textInput(block.max, v => { block.max = v; onChange(); }));
        addRow('Step:', textInput(block.step, v => { block.step = v; onChange(); }));
        break;
      case 'select':
      case 'select_or_number':
      case 'multiselect': {
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        const ta = document.createElement('textarea');
        ta.value = (block.options || []).join('\n');
        ta.placeholder = 'по одному на строку';
        ta.style.cssText = 'flex:1;padding:2px 4px;font-size:11px;min-height:44px;resize:vertical;border:1px solid #888;';
        ta.oninput = () => { block.options = ta.value.split('\n').map(s => s.trim()).filter(Boolean); onChange(); };
        addRow('Варианты:', ta);
        if (block.type === 'select') {
          addRow('По умолч.:', textInput(block.default, v => { block.default = v; onChange(); }, 'первый пункт'));
          (() => { const lbl = boolRow('Не выводить в текст', block.silent, v => { block.silent = v; onChange(); }); wrap.appendChild(lbl); })();
        }
        if (block.type === 'multiselect') addRow('Разделитель:', textInput(block.separator, v => { block.separator = v; onChange(); }, ', '));
        break;
      }
      case 'checkbox':
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        addRow('Текст при вкл.:', textInput(block.text, v => { block.text = v; onChange(); }));
        addRow('Ключ (для text_switch):', textInput(block.key, v => { block.key = v; onChange(); }, 'например flag1'));
        break;
      case 'checkbox_group':
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        addRow('Ключ (для text_switch):', textInput(block.key, v => { block.key = v; onChange(); }, 'например route2'));
        break;
      case 'url':
      case 'url_plain':
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        addRow('Текст ссылки:', textInput(block.linkText, v => { block.linkText = v; onChange(); }));
        break;
      case 'url_with_text':
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        addRow('Текст по умолч.:', textInput(block.linkText, v => { block.linkText = v; onChange(); }));
        break;
      case 'resource_counts':
        addRow('Заголовок:', textInput(block.label, v => { block.label = v; onChange(); }));
        const ta = document.createElement('textarea');
        ta.value = (block.options || []).join('\n');
        ta.placeholder = 'по одному на строку';
        ta.style.cssText = 'flex:1;padding:2px 4px;font-size:11px;min-height:44px;resize:vertical;border:1px solid #888;';
        ta.oninput = () => { block.options = ta.value.split('\n').map(s => s.trim()).filter(Boolean); onChange(); };
        addRow('Ресурсы (по одному):', ta);
        addRow('Разделитель:', textInput(block.separator, v => { block.separator = v; onChange(); }, ', '));
        break;
    }
    return wrap;
  }

  function openEditorModal(opts) {
    opts = opts || {};
    const data = loadData();
    let group = opts.groupId ? data.groups.find(g => g.id === opts.groupId) : null;
    let template = null;
    if (group && opts.templateId) template = group.templates.find(t => t.id === opts.templateId);
    const isNew = !template;
    if (!template) {
      template = { id: genId('t'), name: 'Новый шаблон', blocks: [] };
      if (!group) {
        const m = location.pathname.match(/\/blog\d+/i);
        const mask = m ? m[0].slice(1) : 'blog';
        group = { id: genId('g'), mask, templates: [] };
        data.groups.push(group);
      }
      group.templates.push(template);
    } else {
      template = clone(template);
    }
    const state = { expandedBlock: -1 };

    const overlay = document.createElement('div');
    overlay.className = 'cw-tmpl-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99999;display:flex;align-items:center;justify-content:center;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:#f0f0eb;border:1px solid #888;max-width:640px;width:94%;max-height:88vh;display:flex;flex-direction:column;font-family:Verdana,Arial,sans-serif;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,0.3);';

    const head = document.createElement('div');
    head.style.cssText = 'background:#ddd;padding:6px 10px;border-bottom:1px solid #888;display:flex;justify-content:space-between;align-items:center;';
    head.innerHTML = '<b style="font-size:13px;">' + (isNew ? 'Новый шаблон' : 'Редактирование шаблона') + '</b>';

    let closed = false;
    const cleanup = () => {
      if (closed) return;
      closed = true;
      overlay.remove();
      document.removeEventListener('keydown', kh);
    };
    const kh = (e) => { if (e.key === 'Escape') cleanup(); };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:14px;padding:0 4px;';
    closeBtn.onclick = cleanup;
    head.appendChild(closeBtn);
    modal.appendChild(head);

    const body = document.createElement('div');
    body.style.cssText = 'padding:10px;overflow-y:auto;flex:1;';

    const nameRow = document.createElement('div');
    nameRow.style.cssText = 'margin-bottom:6px;display:flex;gap:6px;align-items:center;';
    nameRow.innerHTML = '<span style="font-size:11px;color:#555;min-width:90px;">Название:</span>';
    const nameInp = document.createElement('input');
    nameInp.type = 'text';
    nameInp.value = template.name;
    nameInp.style.cssText = 'flex:1;padding:3px 6px;border:1px solid #888;font-size:12px;';
    nameInp.oninput = () => { template.name = nameInp.value; refreshPreview(); };
    nameRow.appendChild(nameInp);
    body.appendChild(nameRow);

    const maskRow = document.createElement('div');
    maskRow.style.cssText = 'margin-bottom:6px;display:flex;gap:6px;align-items:center;';
    maskRow.innerHTML = '<span style="font-size:11px;color:#555;min-width:90px;">Маска URL:</span>';
    const maskInp = document.createElement('input');
    maskInp.type = 'text';
    maskInp.value = group.mask;
    maskInp.style.cssText = 'flex:1;padding:3px 6px;border:1px solid #888;font-size:12px;';
    maskInp.oninput = () => { group.mask = maskInp.value; };
    maskRow.appendChild(maskInp);
    body.appendChild(maskRow);

    const blocksWrap = document.createElement('div');
    blocksWrap.style.cssText = 'border:1px solid #ccc;background:#fafaf7;padding:6px;margin-bottom:6px;max-height:340px;overflow-y:auto;';
    body.appendChild(blocksWrap);

    const addRow = document.createElement('div');
    addRow.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:8px;';
    addRow.innerHTML = '<span style="font-size:11px;color:#555;">Добавить блок:</span>';
    const addSel = document.createElement('select');
    addSel.style.cssText = 'padding:2px 4px;font-size:11px;';
    Object.keys(BLOCK_SCHEMAS).forEach(k => {
      const o = document.createElement('option'); o.value = k; o.textContent = BLOCK_SCHEMAS[k].title; addSel.appendChild(o);
    });
    addRow.appendChild(addSel);
    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.style.cssText = 'padding:2px 10px;border:1px solid #5a5;background:#cde8cd;cursor:pointer;font-size:11px;';
    addBtn.onclick = () => {
      const nb = createBlock(addSel.value);
      if (nb) { template.blocks.push(nb); renderBlocks(); refreshPreview(); }
    };
    addRow.appendChild(addBtn);
    body.appendChild(addRow);

    const pvLabel = document.createElement('div');
    pvLabel.style.cssText = 'font-size:11px;color:#555;margin-bottom:2px;';
    pvLabel.textContent = 'Предпросмотр (BBCode):';
    body.appendChild(pvLabel);
    const preview = document.createElement('div');
    preview.style.cssText = 'border:1px dashed #aaa;background:#f8f8f5;padding:6px;font-family:monospace;font-size:11px;white-space:pre-wrap;word-break:break-word;min-height:30px;max-height:180px;overflow-y:auto;';
    body.appendChild(preview);

    modal.appendChild(body);

    const foot = document.createElement('div');
    foot.style.cssText = 'padding:8px 10px;border-top:1px solid #888;background:#e8e8e5;display:flex;gap:6px;justify-content:flex-end;';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Сохранить';
    saveBtn.style.cssText = 'padding:3px 14px;border:1px solid #5a5;background:#cde8cd;cursor:pointer;font-size:12px;font-family:Verdana,Arial,sans-serif;';
    saveBtn.onclick = () => {
      if (!template.name.trim()) { alert('Название не может быть пустым.'); return; }
      const live = loadData();
      let g = live.groups.find(x => x.id === group.id);
      if (!g) { g = { id: group.id, mask: group.mask, templates: [] }; live.groups.push(g); }
      else { g.mask = group.mask; }
      const existing = g.templates.find(t => t.id === template.id);
      if (existing) Object.assign(existing, clone(template));
      else g.templates.push(clone(template));
      saveData(live);
      cleanup();
      location.reload();
    };
    foot.appendChild(saveBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Отмена';
    cancelBtn.style.cssText = 'padding:3px 10px;border:1px solid #888;background:#ddd;cursor:pointer;font-size:12px;font-family:Verdana,Arial,sans-serif;';
    cancelBtn.onclick = () => {
      if (isNew) {
        const live = loadData();
        const g = live.groups.find(x => x.id === group.id);
        if (g) {
          g.templates = g.templates.filter(t => t.id !== template.id);
          if (!g.templates.length) live.groups = live.groups.filter(x => x.id !== g.id);
          saveData(live);
        }
      }
      cleanup();
    };
    foot.appendChild(cancelBtn);

    modal.appendChild(foot);
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cancelBtn.onclick(); });
    document.addEventListener('keydown', kh);
    document.body.appendChild(overlay);

    function refreshPreview() {
      const demo = {};
      template.blocks.forEach((b, i) => {
        const fid = 'cw_f_' + i;
        if (b.type === 'other_userid') demo[fid] = [{ id: 'ID', count: '3', count2: '2' }];
        else if (b.type === 'url') demo[fid] = ['https://example.com'];
        else if (b.type === 'url_plain') demo[fid] = 'https://example.com';
        else if (b.type === 'url_with_text') demo[fid] = { url: 'https://example.com', text: 'ссылка' };
        else if (b.type === 'multiselect') demo[fid] = [{ value: (b.options && b.options[0]) || 'X', count: '1' }];
        else if (b.type === 'checkbox') demo[fid] = '1';
        else if (b.type === 'checkbox_group') demo[fid] = '1';
        else if (b.type === 'select') demo[fid] = (b.options && b.options[0]) || '';
        else if (b.type === 'select_or_number') demo[fid] = (b.options && b.options[0]) || '0';
        else if (b.type === 'number') demo[fid] = '1';
        else if (b.type === 'date_ddmm') { const n = getMskDate(); demo[fid] = String(n.getDate()).padStart(2, '0') + '.' + String(n.getMonth() + 1).padStart(2, '0'); }
        else if (b.type === 'time_hm') demo[fid] = '0:00';
        else if (b.type === 'time_manual') demo[fid] = '13:47';
        else if (b.type === 'user_text') demo[fid] = 'текст';
        else if (b.type === 'resource_counts') demo[fid] = { [(b.options && b.options[0]) || 'X']: '5' };
      });
      preview.textContent = generateText(template.blocks, demo);
    }

    function renderBlocks() {
      blocksWrap.innerHTML = '';
      if (!template.blocks.length) {
        blocksWrap.innerHTML = '<div style="color:#999;font-size:11px;">(нет блоков — добавь через выпадающий список ниже)</div>';
        return;
      }
      template.blocks.forEach((b, idx) => {
        const card = document.createElement('div');
        card.style.cssText = 'border:1px solid #ccc;background:#fff;margin-bottom:3px;';
        const bHead = document.createElement('div');
        bHead.style.cssText = 'padding:4px 6px;display:flex;align-items:center;gap:6px;background:#f0f0f0;cursor:pointer;';
        const typeTag = document.createElement('span');
        typeTag.textContent = b.type;
        typeTag.style.cssText = 'font-size:10px;background:#dcdcdc;padding:1px 4px;border-radius:2px;color:#333;';
        const sum = document.createElement('span');
        sum.textContent = summarizeBlock(b);
        sum.style.cssText = 'flex:1;font-size:11px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        const up = document.createElement('button'); up.textContent = '↑';
        up.style.cssText = 'font-size:10px;padding:0 4px;border:1px solid #888;background:#eee;cursor:pointer;';
        up.onclick = (e) => { e.stopPropagation(); if (idx > 0) { [template.blocks[idx - 1], template.blocks[idx]] = [template.blocks[idx], template.blocks[idx - 1]]; state.expandedBlock = idx - 1; renderBlocks(); refreshPreview(); } };
        const dn = document.createElement('button'); dn.textContent = '↓';
        dn.style.cssText = up.style.cssText;
        dn.onclick = (e) => { e.stopPropagation(); if (idx < template.blocks.length - 1) { [template.blocks[idx + 1], template.blocks[idx]] = [template.blocks[idx], template.blocks[idx + 1]]; state.expandedBlock = idx + 1; renderBlocks(); refreshPreview(); } };
        const dup = document.createElement('button'); dup.textContent = '⧉';
        dup.style.cssText = up.style.cssText; dup.title = 'Дублировать';
        dup.onclick = (e) => { e.stopPropagation(); template.blocks.splice(idx + 1, 0, clone(b)); renderBlocks(); refreshPreview(); };
        const rm = document.createElement('button'); rm.textContent = '×';
        rm.style.cssText = 'font-size:10px;padding:0 4px;border:1px solid #a66;background:#f0d0d0;cursor:pointer;';
        rm.onclick = (e) => { e.stopPropagation(); template.blocks.splice(idx, 1); state.expandedBlock = -1; renderBlocks(); refreshPreview(); };
        bHead.appendChild(typeTag); bHead.appendChild(sum);
        bHead.appendChild(up); bHead.appendChild(dn); bHead.appendChild(dup); bHead.appendChild(rm);
        card.appendChild(bHead);

        if (state.expandedBlock === idx) {
          const props = renderBlockProps(b, () => { renderBlocks(); refreshPreview(); });
          card.appendChild(props);
          if (b.type === 'checkbox_group') {
            const nWrap = document.createElement('div');
            nWrap.style.cssText = 'padding:6px;background:#fafafa;border-top:1px solid #e0e0e0;';
            const nHeader = document.createElement('div');
            nHeader.style.cssText = 'font-size:11px;color:#555;margin-bottom:4px;';
            nHeader.textContent = 'Вложенные блоки (' + ((b.blocks || []).length) + '):';
            nWrap.appendChild(nHeader);

            const nList = document.createElement('div');
            b.blocks = b.blocks || [];
            b.blocks.forEach((nb, nIdx) => {
              const nRow = document.createElement('div');
              nRow.style.cssText = 'display:flex;gap:4px;align-items:center;padding:2px 4px;background:#fff;border:1px solid #ddd;margin-bottom:2px;';
              const nTag = document.createElement('span'); nTag.textContent = nb.type;
              nTag.style.cssText = 'font-size:10px;background:#e0e0e0;padding:0 4px;border-radius:2px;';
              const nSum = document.createElement('span'); nSum.textContent = summarizeBlock(nb);
              nSum.style.cssText = 'flex:1;font-size:11px;color:#333;';
              const nRm = document.createElement('button'); nRm.textContent = '×';
              nRm.style.cssText = 'font-size:10px;padding:0 4px;border:1px solid #a66;background:#f0d0d0;cursor:pointer;';
              nRm.onclick = () => { b.blocks.splice(nIdx, 1); renderBlocks(); refreshPreview(); };
              nRow.appendChild(nTag); nRow.appendChild(nSum); nRow.appendChild(nRm);
              nList.appendChild(nRow);
            });
            nWrap.appendChild(nList);

            const nAddRow = document.createElement('div');
            nAddRow.style.cssText = 'display:flex;gap:4px;margin-top:4px;align-items:center;';
            const nSel = document.createElement('select');
            nSel.style.cssText = 'padding:1px 4px;font-size:11px;';
            Object.keys(BLOCK_SCHEMAS).forEach(k => {
              if (k === 'checkbox_group') return;
              const o = document.createElement('option'); o.value = k; o.textContent = BLOCK_SCHEMAS[k].title; nSel.appendChild(o);
            });
            const nAddBtn = document.createElement('button'); nAddBtn.textContent = '+';
            nAddBtn.style.cssText = 'padding:1px 8px;border:1px solid #5a5;background:#cde8cd;cursor:pointer;font-size:11px;';
            nAddBtn.onclick = () => { const nb = createBlock(nSel.value); if (nb) { b.blocks.push(nb); renderBlocks(); refreshPreview(); } };
            nAddRow.appendChild(nSel); nAddRow.appendChild(nAddBtn);
            nWrap.appendChild(nAddRow);
            card.appendChild(nWrap);
          }
        }

        bHead.onclick = () => {
          state.expandedBlock = state.expandedBlock === idx ? -1 : idx;
          renderBlocks();
        };
        blocksWrap.appendChild(card);
      });
    }

    renderBlocks();
    refreshPreview();
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  }
  function pickFileAndRead(cb) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => cb(String(r.result || ''));
      r.onerror = () => alert('Не удалось прочитать файл.');
      r.readAsText(f);
    };
    inp.click();
  }

  function addTemplateButtons(form, textarea) {
    const list = getTemplatesForPage();
    if (!list.length) return;
    if (form.querySelector('.cw-tmpl-btnbox')) return;

    const box = document.createElement('div');
    box.className = 'cw-tmpl-btnbox';
    box.style.cssText = 'margin:10px 0 5px 0;padding:8px 10px;background:#f5f5f5;border:1px solid #bbb;border-radius:4px;font-family:Verdana,Arial,sans-serif;';

    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:12px;color:#333;margin-bottom:6px;font-weight:500;';
        lbl.textContent = 'Шаблоны отписей:';
    box.appendChild(lbl);

    list.forEach(({ tmpl }) => {
      const btn = document.createElement('input');
      btn.type = 'button';
      btn.value = tmpl.name;
      btn.style.cssText = 'margin:2px 3px;padding:3px 8px;border:1px solid #999;background:#fff;color:#222;cursor:pointer;font-size:12px;font-family:Verdana,Arial,sans-serif;border-radius:3px;';
      btn.onmouseover = () => btn.style.background = '#e8e8e8';
      btn.onmouseout = () => btn.style.background = '#fff';
      btn.onclick = () => openTemplateModal(tmpl, textarea);
      box.appendChild(btn);
    });

    form.prepend(box);
  }

  // ════════════════════════════════════════════
  //  ПАНЕЛЬ УПРАВЛЕНИЯ
  // ════════════════════════════════════════════
  function addControlPanel() {
    if (document.getElementById('cw-tmpl-ctrl')) return;

    const panel = document.createElement('div');
    panel.id = 'cw-tmpl-ctrl';
    panel.style.cssText = 'position:fixed;bottom:4px;left:4px;z-index:99998;font-family:Verdana,Arial,sans-serif;font-size:12px;background:#eee;border:1px solid #999;max-width:380px;width:calc(100% - 20px);color:#222;box-shadow:0 2px 8px rgba(0,0,0,0.15);';

    const head = document.createElement('div');
    head.style.cssText = 'padding:6px 10px;background:#4a4a4a;color:#fff;border-bottom:1px solid #333;cursor:pointer;user-select:none;font-weight:bold;font-size:13px;display:flex;justify-content:space-between;align-items:center;';
    const headTitle = document.createElement('span');
    headTitle.textContent = '⚙ Шаблоны';
    const headCount = document.createElement('span');
    headCount.style.cssText = 'font-size:11px;font-weight:normal;opacity:0.8;';
    head.appendChild(headTitle); head.appendChild(headCount);
    panel.appendChild(head);

    const content = document.createElement('div');
    content.style.cssText = 'padding:8px;max-height:65vh;overflow-y:auto;display:none;';
    panel.appendChild(content);

    const sec1 = document.createElement('div');
    sec1.style.cssText = 'margin-bottom:6px;';
    sec1.innerHTML = '<label style="font-size:11px;">Твой ID: <input type="text" id="cw-ctrl-myid" value="' + escAttr(getMyId()) + '" style="width:120px;font-family:monospace;font-size:11px;border:1px solid #888;padding:1px 3px;"></label> <button id="cw-ctrl-saveid" style="font-size:11px;">OK</button>';
    content.appendChild(sec1);

    const secCreate = document.createElement('div');
    secCreate.style.cssText = 'margin-bottom:6px;display:flex;gap:4px;flex-wrap:wrap;';
      secCreate.innerHTML =
      '<button id="cw-ctrl-create" class="cw-ctrl-btn" style="font-size:11px;padding:3px 8px;cursor:pointer;">+ Создать шаблон</button>' +
      '<button id="cw-ctrl-savefile" class="cw-ctrl-btn" style="font-size:11px;padding:3px 8px;cursor:pointer;">⬇ Скачать .json</button>' +
      '<button id="cw-ctrl-loadfile" class="cw-ctrl-btn" style="font-size:11px;padding:3px 8px;cursor:pointer;">⬆ Загрузить .json</button>' +
      '<button id="cw-ctrl-reload-builtin" class="cw-ctrl-btn" style="font-size:11px;padding:3px 8px;cursor:pointer;">↻ Перезалить вшитые</button>';
    content.appendChild(secCreate);

    const secSearch = document.createElement('div');
    secSearch.style.cssText = 'margin-bottom:6px;';
    secSearch.innerHTML = '<input type="text" id="cw-ctrl-search" placeholder="Поиск по шаблонам..." style="width:100%;padding:2px 4px;font-size:11px;border:1px solid #888;box-sizing:border-box;">';
    content.appendChild(secSearch);

    const listWrap = document.createElement('div');
    listWrap.id = 'cw-ctrl-list';
    listWrap.style.cssText = 'font-size:11px;max-height:260px;overflow-y:auto;border-top:1px solid #ccc;padding-top:4px;';
    content.appendChild(listWrap);

    const secImp = document.createElement('details');
    secImp.style.cssText = 'margin-top:6px;border-top:1px solid #bbb;padding-top:4px;';
    secImp.innerHTML = '<summary style="font-size:11px;cursor:pointer;">Импорт/экспорт/бэкапы</summary>';
    const impBody = document.createElement('div');
    impBody.style.cssText = 'margin-top:4px;';
    impBody.innerHTML =
      '<textarea id="cw-ctrl-import" placeholder="вставь JSON-код" style="width:100%;height:60px;font-family:monospace;font-size:11px;border:1px solid #888;padding:2px;box-sizing:border-box;"></textarea>' +
      '<div style="margin-top:3px;display:flex;gap:3px;flex-wrap:wrap;">' +
        '<button id="cw-ctrl-doimport" style="font-size:11px;">Импортировать</button>' +
        '<button id="cw-ctrl-doexport" style="font-size:11px;">Экспортировать в поле</button>' +
        '<button id="cw-ctrl-backups" style="font-size:11px;">Бэкапы</button>' +
      '</div>' +
      '<div id="cw-ctrl-msg" style="font-size:11px;margin-top:3px;white-space:pre-wrap;"></div>';
    secImp.appendChild(impBody);
    content.appendChild(secImp);

    document.body.appendChild(panel);

    let open = false;
    const setOpen = (v) => {
      open = v;
      content.style.display = open ? 'block' : 'none';
      headTitle.textContent = open ? '⚙ Шаблоны (скрыть)' : '⚙ Шаблоны';
      if (open) renderList();
    };
    head.onclick = () => setOpen(!open);

    document.addEventListener('mousedown', (e) => {
      if (!open) return;
      if (panel.contains(e.target)) return;
      if (e.target && e.target.closest && e.target.closest('.cw-tmpl-modal-overlay')) return;
      setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е')) {
        e.preventDefault();
        setOpen(!open);
      }
    });

    document.getElementById('cw-ctrl-saveid').onclick = () => {
      const id = document.getElementById('cw-ctrl-myid').value.trim();
      setMyId(id);
      showCtrlMsg('ID сохранён: ' + id, false);
      updateCount();
    };

    document.getElementById('cw-ctrl-create').onclick = () => {
      const m = location.pathname.match(/\/blog\d+/i);
      const mask = m ? m[0].slice(1) : 'blog';
      const data = loadData();
      let g = data.groups.find(x => x.mask === mask);
      if (!g) {
        g = { id: genId('g'), mask, templates: [] };
        data.groups.push(g);
        saveData(data);
      }
      openEditorModal({ groupId: g.id });
    };

    document.getElementById('cw-ctrl-savefile').onclick = () => {
      const data = loadData();
      const clean = clone(data);
      clean.groups.forEach(g => {
        g.templates.forEach(t => delete t.id);
        delete g.id;
      });
      downloadJson('cw-templates-' + new Date().toISOString().slice(0, 10) + '.json', clean);
    };

    document.getElementById('cw-ctrl-loadfile').onclick = () => {
      pickFileAndRead((txt) => {
        try {
          const imp = JSON.parse(txt);
          if (!imp || !Array.isArray(imp.groups)) throw new Error('Нет поля groups');
          mergeImport(imp);
          showCtrlMsg('Импортировано из файла.', false);
          renderList();
          updateCount();
        } catch(e) { showCtrlMsg('Ошибка файла: ' + e.message, true); }
      });
    };

    document.getElementById('cw-ctrl-reload-builtin').onclick = () => {
      if (!confirm('Перезалить вшитые шаблоны? Шаблоны с совпадающими именами будут заменены. Остальные останутся.')) return;
      applyBuiltins(true);
      renderList();
      updateCount();
      showCtrlMsg('Вшитые шаблоны перезалиты. Обнови страницу (F5).', false);
    };

    document.getElementById('cw-ctrl-search').oninput = () => renderList();

    document.getElementById('cw-ctrl-doimport').onclick = () => {
      const raw = document.getElementById('cw-ctrl-import').value.trim();
      if (!raw) { showCtrlMsg('Поле пустое.', true); return; }
      try {
        const lines = raw.split('\n').map(l => l.trim()).filter(l => l);
        let lastMyId = '';
        let parsedLines = false;
        if (lines.length > 1) {
          for (const line of lines) {
            try {
              const o = JSON.parse(line);
              if (o && Array.isArray(o.groups)) {
                parsedLines = true;
                mergeImport(o);
                if (o.myId) lastMyId = o.myId;
              }
            } catch(e2) {}
          }
        }
        if (!parsedLines) {
          const o = JSON.parse(raw);
          if (o && Array.isArray(o.groups)) {
            mergeImport(o);
            if (o.myId) lastMyId = o.myId;
          } else {
            throw new Error('Нет поля groups');
          }
        }
        if (lastMyId && !getMyId()) setMyId(lastMyId);
        showCtrlMsg('Импорт выполнен. Обнови страницу (F5).', false);
        renderList();
        updateCount();
      } catch(e) { showCtrlMsg('Ошибка: ' + e.message, true); }
    };

    document.getElementById('cw-ctrl-doexport').onclick = () => {
      const data = loadData();
      const myId = getMyId();
      const lines = [];
      data.groups.forEach(g => {
        g.templates.forEach(t => {
          const tCopy = clone(t);
          delete tCopy.id;
          delete tCopy.builtin;
          lines.push(JSON.stringify({ myId, groups: [{ mask: g.mask, templates: [tCopy] }] }));
        });
      });
      document.getElementById('cw-ctrl-import').value = lines.join('\n');
      showCtrlMsg('Экспортировано в поле выше.', false);
    };

    document.getElementById('cw-ctrl-backups').onclick = () => {
      const list = getBackups();
      if (!list.length) { showCtrlMsg('Бэкапов нет.', false); return; }
      let html = '<div style="font-size:11px;margin-top:4px;">';
      list.forEach((b, i) => {
        const d = new Date(b.ts).toLocaleString();
        const size = (b.data.length / 1024).toFixed(1);
        html += '<div style="display:flex;gap:4px;align-items:center;margin-bottom:2px;">' +
          '<span style="flex:1;">' + escHtml(d) + ' (' + size + ' КБ)</span>' +
          '<button data-bidx="' + i + '" class="cw-ctrl-restore" style="font-size:10px;padding:0 6px;">↺</button>' +
        '</div>';
      });
      html += '<button id="cw-ctrl-clearbackups" style="font-size:10px;margin-top:4px;">Очистить все</button></div>';
      const msg = document.getElementById('cw-ctrl-msg');
      msg.innerHTML = html;
      msg.querySelectorAll('.cw-ctrl-restore').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.getAttribute('data-bidx'));
          if (!confirm('Восстановить бэкап от ' + new Date(list[idx].ts).toLocaleString() + '? Текущие данные перезапишутся.')) return;
          try {
            const data = JSON.parse(list[idx].data);
            saveData(data, { skipBackup: true });
            location.reload();
          } catch(e) { alert('Ошибка: ' + e.message); }
        };
      });
      const clr = document.getElementById('cw-ctrl-clearbackups');
      if (clr) clr.onclick = () => {
        if (!confirm('Удалить все бэкапы?')) return;
        localStorage.removeItem(KEYS.BACKUP);
        showCtrlMsg('Бэкапы удалены.', false);
      };
    };

    renderList();
    updateCount();

    function renderList() {
      const data = loadData();
      const list = document.getElementById('cw-ctrl-list');
      if (!list) return;
      const q = (document.getElementById('cw-ctrl-search').value || '').toLowerCase();
      if (!data.groups.length) {
        list.textContent = '(шаблонов нет — нажми «+ Создать шаблон»)';
        return;
      }
      let html = '';
      data.groups.forEach(g => {
        const visible = g.templates.filter(t => !q || t.name.toLowerCase().includes(q));
        if (!visible.length && q) return;
        html += '<div style="margin-bottom:4px;"><b>' + escHtml(g.mask) + '</b> (' + g.templates.length + ' шабл.)';
        html += ' <button data-gid="' + escAttr(g.id) + '" class="cw-ctrl-delg" style="font-size:10px;padding:0 4px;margin-left:4px;">×</button>';
        html += '</div>';
        visible.forEach(t => {
          const builtinBadge = t.builtin ? ' <span style="font-size:9px;color:#777;">[вшит]</span>' : '';
          html += '<div style="display:flex;gap:4px;align-items:center;padding-left:10px;margin-bottom:1px;">' +
            '<span style="flex:1;">• ' + escHtml(t.name) + builtinBadge + '</span>' +
            '<button data-tid="' + escAttr(t.id) + '" data-gid="' + escAttr(g.id) + '" class="cw-ctrl-editt" style="font-size:10px;padding:0 4px;" title="Редактировать">✎</button>' +
            '<button data-tid="' + escAttr(t.id) + '" data-gid="' + escAttr(g.id) + '" class="cw-ctrl-dupt" style="font-size:10px;padding:0 4px;" title="Дублировать">⧉</button>' +
            '<button data-tid="' + escAttr(t.id) + '" data-gid="' + escAttr(g.id) + '" class="cw-ctrl-delt" style="font-size:10px;padding:0 4px;border:1px solid #a66;background:#f0d0d0;" title="Удалить">×</button>' +
          '</div>';
        });
      });
      list.innerHTML = html;

      list.querySelectorAll('.cw-ctrl-editt').forEach(btn => {
        btn.onclick = () => openEditorModal({ groupId: btn.getAttribute('data-gid'), templateId: btn.getAttribute('data-tid') });
      });
      list.querySelectorAll('.cw-ctrl-dupt').forEach(btn => {
        btn.onclick = () => {
          const d = loadData();
          const g = d.groups.find(x => x.id === btn.getAttribute('data-gid'));
          const t = g && g.templates.find(x => x.id === btn.getAttribute('data-tid'));
          if (!g || !t) return;
          const copy = clone(t);
          copy.id = genId('t');
          copy.name = t.name + ' (копия)';
          delete copy.builtin;
          g.templates.push(copy);
          saveData(d);
          renderList();
          updateCount();
        };
      });
      list.querySelectorAll('.cw-ctrl-delt').forEach(btn => {
        btn.onclick = () => {
          const d = loadData();
          const g = d.groups.find(x => x.id === btn.getAttribute('data-gid'));
          if (!g) return;
          const t = g.templates.find(x => x.id === btn.getAttribute('data-tid'));
          if (!t) return;
          if (!confirm('Удалить шаблон "' + t.name + '"?')) return;
          g.templates = g.templates.filter(x => x.id !== t.id);
          if (!g.templates.length) d.groups = d.groups.filter(x => x.id !== g.id);
          saveData(d);
          renderList();
          updateCount();
        };
      });
      list.querySelectorAll('.cw-ctrl-delg').forEach(btn => {
        btn.onclick = () => {
          const gid = btn.getAttribute('data-gid');
          const d = loadData();
          const g = d.groups.find(x => x.id === gid);
          if (!g) return;
          if (!confirm('Удалить группу "' + g.mask + '" со всеми шаблонами?')) return;
          d.groups = d.groups.filter(x => x.id !== gid);
          saveData(d);
          renderList();
          updateCount();
        };
      });
    }

    function updateCount() {
      const data = loadData();
      let total = 0;
      data.groups.forEach(g => total += g.templates.length);
      headCount.textContent = total ? ('(' + total + ' в ' + data.groups.length + ' гр.)') : '';
    }

    function showCtrlMsg(text, err) {
      const el = document.getElementById('cw-ctrl-msg');
      if (!el) return;
      el.textContent = text;
      el.style.color = err ? '#a33' : '#363';
    }
  }

  function mergeImport(imp) {
    const data = loadData();
    (imp.groups || []).forEach(g => {
      if (!g || typeof g.mask !== 'string') return;
      let ex = data.groups.find(x => x.mask === g.mask);
      if (!ex) {
        ex = { id: genId('g'), mask: g.mask, templates: [] };
        data.groups.push(ex);
      }
      (g.templates || []).forEach(t => {
        if (!t || !t.name || !Array.isArray(t.blocks)) return;
        if (!ex.templates.find(et => et.name === t.name)) {
          t.id = genId('t');
          ex.templates.push(t);
        }
      });
    });
    saveData(data, { skipBackup: true });
  }

  // ════════════════════════════════════════════
  //  ИНТЕРФЕЙС НАСТРОЕК (на странице настроек)
  // ════════════════════════════════════════════
  function injectSettingsUI() {
    // Проверяет, что мы на странице настроек
    if (!location.pathname.includes('settings') && !location.pathname.includes('options')) return;
    if (document.getElementById('cw-color-settings')) return;

    // Ищет контейнер, куда можно вставить настройки
    const container = document.querySelector('.main-container') || document.body;

    const box = document.createElement('div');
    box.id = 'cw-color-settings';
    box.style.cssText = 'margin: 15px 0; padding: 15px; background: transparent; font-family: Verdana, sans-serif; font-size: 13px; box-sizing: border-box; width: 100%;';
    
    box.innerHTML = `<h3 style="margin-top:0; font-size: 15px; font-weight: bold; border-bottom: 1px solid rgba(128,128,128,0.3); padding-bottom: 8px; margin-bottom: 12px;">Настройки цветов: Шаблоны отписей</h3>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
        <label style="display:flex; justify-content:space-between; align-items:center; background: rgba(128,128,128,0.15); padding: 8px 12px; border-radius: 4px;">Фон панели: <input type="color" id="cw-col-bg" value="${getColors().bg}" style="border: none; background: transparent; cursor: pointer; width: 35px; height: 22px; padding: 0;"></label>
        <label style="display:flex; justify-content:space-between; align-items:center; background: rgba(128,128,128,0.15); padding: 8px 12px; border-radius: 4px;">Цвет текста: <input type="color" id="cw-col-text" value="${getColors().text}" style="border: none; background: transparent; cursor: pointer; width: 35px; height: 22px; padding: 0;"></label>
        <label style="display:flex; justify-content:space-between; align-items:center; background: rgba(128,128,128,0.15); padding: 8px 12px; border-radius: 4px;">Шапка панели: <input type="color" id="cw-col-header" value="${getColors().header}" style="border: none; background: transparent; cursor: pointer; width: 35px; height: 22px; padding: 0;"></label>
        <label style="display:flex; justify-content:space-between; align-items:center; background: rgba(128,128,128,0.15); padding: 8px 12px; border-radius: 4px;">Текст шапки: <input type="color" id="cw-col-headerText" value="${getColors().headerText}" style="border: none; background: transparent; cursor: pointer; width: 35px; height: 22px; padding: 0;"></label>
        <label style="display:flex; justify-content:space-between; align-items:center; background: rgba(128,128,128,0.15); padding: 8px 12px; border-radius: 4px;">Кнопки: <input type="color" id="cw-col-btn" value="${getColors().btn}" style="border: none; background: transparent; cursor: pointer; width: 35px; height: 22px; padding: 0;"></label>
        <label style="display:flex; justify-content:space-between; align-items:center; background: rgba(128,128,128,0.15); padding: 8px 12px; border-radius: 4px;">Текст кнопок: <input type="color" id="cw-col-btnText" value="${getColors().btnText}" style="border: none; background: transparent; cursor: pointer; width: 35px; height: 22px; padding: 0;"></label>
      </div>
      <div style="margin-top:15px; display:flex; gap: 10px;">
        <button id="cw-col-save" style="padding: 8px 15px; cursor:pointer; border-radius: 4px; border: 1px solid rgba(128,128,128,0.5); background: rgba(128,128,128,0.2); font-family: inherit; font-size: 13px;">Сохранить цвета</button>
        <button id="cw-col-reset" style="padding: 8px 15px; cursor:pointer; border-radius: 4px; border: 1px solid rgba(128,128,128,0.5); background: rgba(128,128,128,0.2); font-family: inherit; font-size: 13px;">Сбросить</button>
      </div>
    `;

    if (container === document.body) {
      box.style.maxWidth = '1000px';
      box.style.margin = '15px auto';
      box.style.padding = '15px 20px';
    }

    container.appendChild(box);

    document.getElementById('cw-col-save').onclick = () => {
      const colors = {
        bg: document.getElementById('cw-col-bg').value,
        text: document.getElementById('cw-col-text').value,
        header: document.getElementById('cw-col-header').value,
        headerText: document.getElementById('cw-col-headerText').value,
        btn: document.getElementById('cw-col-btn').value,
        btnText: document.getElementById('cw-col-btnText').value,
        border: getColors().border
      };
      saveColors(colors);
      alert('Цвета сохранены! Перезагрузите страницу, чтобы увидеть изменения.');
    };

    document.getElementById('cw-col-reset').onclick = () => {
      if(confirm('Сбросить все цвета на стандартные?')) {
        saveColors(DEFAULT_COLORS);
        location.reload();
      }
    };
  }

    function init() {
    applyColors(); 
    injectSettingsUI(); 

    if (!isBlogPage()) return;
    injectMobileStyles();
    addControlPanel();
    refreshTemplateButtons();
  }

  function refreshTemplateButtons() {
    if (!isBlogPage()) return;
    const form = document.querySelector('#send_comment_form');
    const textarea = document.querySelector('#comment');
    if (!form || !textarea) return;
    const existing = form.querySelector('.cw-tmpl-btnbox');
    const expected = getTemplatesForPage();
    if (expected.length === 0) { if (existing) existing.remove(); return; }
    if (existing) {
      const names = new Set(Array.from(existing.querySelectorAll('input[type=button]')).map(b => b.value));
      const differs = expected.some(({ tmpl }) => !names.has(tmpl.name)) || names.size !== expected.length;
      if (!differs) return;
      existing.remove();
    }
    addTemplateButtons(form, textarea);
  }

  applyBuiltins();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  let refreshTimer = null;
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshTemplateButtons, 200);
  };
  try {
    const obs = new MutationObserver(scheduleRefresh);
    obs.observe(document.body, { childList: true, subtree: true });
  } catch(e) { warn('MutationObserver fail', e); }
  try {
    ['pushState', 'replaceState'].forEach(fn => {
      const orig = history[fn];
      history[fn] = function() {
        const r = orig.apply(this, arguments);
        scheduleRefresh();
        return r;
      };
    });
    window.addEventListener('popstate', scheduleRefresh);
  } catch(e) { warn('history hook fail', e); }

  let retries = 0;
  const retryTimer = setInterval(() => {
    retries++;
    if (!isBlogPage()) { clearInterval(retryTimer); return; }
    if (!document.getElementById('cw-tmpl-ctrl')) addControlPanel();
    refreshTemplateButtons();
    if (retries > 30) clearInterval(retryTimer);
  }, 500);

})();
