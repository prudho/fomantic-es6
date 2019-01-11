"use strict";

import Module from '../module';
import './popup';

import $ from 'cash-dom';
import { Popup } from './popup';

const timeGapTable = {
    '5': {'row': 4, 'column': 3 },
    '10': {'row': 3, 'column': 2 },
    '15': {'row': 2, 'column': 2 },
    '20': {'row': 3, 'column': 1 },
    '30': {'row': 2, 'column': 1 }
};

const settings = {
    name            : 'Calendar',
    namespace       : 'calendar',

    silent: false,
    debug: false,
    verbose: false,
    performance: true,

    type               : 'datetime', // picker type, can be 'datetime', 'date', 'time', 'month', or 'year'
    firstDayOfWeek     : 0,          // day for first day column (0 = Sunday)
    constantHeight     : true,       // add rows to shorter months to keep day calendar height consistent (6 rows)
    today              : false,      // show a 'today/now' button at the bottom of the calendar
    closable           : true,       // close the popup after selecting a date/time
    monthFirst         : true,       // month before day when parsing/converting date from/to text
    touchReadonly      : true,       // set input to readonly on touch devices
    inline             : false,      // create the calendar inline instead of inside a popup
    on                 : null,       // when to show the popup (defaults to 'focus' for input, 'click' for others)
    initialDate        : null,       // date to display initially when no date is selected (null = now)
    startMode          : false,      // display mode to start in, can be 'year', 'month', 'day', 'hour', 'minute' (false = 'day')
    minDate            : null,       // minimum date/time that can be selected, dates/times before are disabled
    maxDate            : null,       // maximum date/time that can be selected, dates/times after are disabled
    ampm               : true,       // show am/pm in time mode
    disableYear        : false,      // disable year selection mode
    disableMonth       : false,      // disable month selection mode
    disableMinute      : false,      // disable minute selection mode
    formatInput        : true,       // format the input text upon input blur and module creation
    startCalendar      : null,       // jquery object or selector for another calendar that represents the start date of a date range
    endCalendar        : null,       // jquery object or selector for another calendar that represents the end date of a date range
    multiMonth         : 1,          // show multiple months when in 'day' mode
    minTimeGap         : 5,
    showWeekNumbers    : null,       // show Number of Week at the very first column of a dayView
    disabledDates      : [],         // specific day(s) which won't be selectable and contain additional information.
    disabledDaysOfWeek : [],         // day(s) which won't be selectable(s) (0 = Sunday)
    // popup options ('popup', 'on', 'hoverable', and show/hide callbacks are overridden)
    popupOptions: {
        position: 'bottom left',
        lastResort: 'bottom left',
        prefer: 'opposite',
        hideOnScroll: false
    },

    text: {
        days: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        today: 'Today',
        now: 'Now',
        am: 'AM',
        pm: 'PM',
        weekNo: 'Week'
    },

    formatter: {
        header: function (date, mode, settings) {
            return mode === 'year' ? settings.formatter.yearHeader(date, settings) :
                mode === 'month' ? settings.formatter.monthHeader(date, settings) :
                mode === 'day' ? settings.formatter.dayHeader(date, settings) :
                    mode === 'hour' ? settings.formatter.hourHeader(date, settings) :
                    settings.formatter.minuteHeader(date, settings);
        },
        yearHeader: function (date, settings) {
            var decadeYear = Math.ceil(date.getFullYear() / 10) * 10;
            return (decadeYear - 9) + ' - ' + (decadeYear + 2);
        },
        monthHeader: function (date, settings) {
            return date.getFullYear();
        },
        dayHeader: function (date, settings) {
            var month = settings.text.months[date.getMonth()];
            var year = date.getFullYear();
            return month + ' ' + year;
        },
        hourHeader: function (date, settings) {
            return settings.formatter.date(date, settings);
        },
        minuteHeader: function (date, settings) {
            return settings.formatter.date(date, settings);
        },
        dayColumnHeader: function (day, settings) {
            return settings.text.days[day];
        },
        datetime: function (date, settings) {
            if (!date) {
                return '';
            }
            var day = settings.type === 'time' ? '' : settings.formatter.date(date, settings);
            var time = settings.type.indexOf('time') < 0 ? '' : settings.formatter.time(date, settings, false);
            var separator = settings.type === 'datetime' ? ' ' : '';
            return day + separator + time;
        },
        date: function (date, settings) {
            if (!date) {
                return '';
            }
            var day = date.getDate();
            var month = settings.text.months[date.getMonth()];
            var year = date.getFullYear();
            return settings.type === 'year' ? year :
                settings.type === 'month' ? month + ' ' + year :
                (settings.monthFirst ? month + ' ' + day : day + ' ' + month) + ', ' + year;
        },
        time: function (date, settings, forCalendar) {
            if (!date) {
                return '';
            }
            var hour = date.getHours();
            var minute = date.getMinutes();
            var ampm = '';
            if (settings.ampm) {
                ampm = ' ' + (hour < 12 ? settings.text.am : settings.text.pm);
                hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            }
            return hour + ':' + (minute < 10 ? '0' : '') + minute + ampm;
        },
        today: function (settings) {
            return settings.type === 'date' ? settings.text.today : settings.text.now;
        },
        cell: function (cell, date, cellOptions) {
        }
    },

    parser: {
        date: function (text, settings) {
            if (!text) {
                return null;
            }
            text = ('' + text).trim().toLowerCase();
            if (text.length === 0) {
                return null;
            }

            var i, j, k;
            var minute = -1, hour = -1, day = -1, month = -1, year = -1;
            var isAm = undefined;

            var isTimeOnly = settings.type === 'time';
            var isDateOnly = settings.type.indexOf('time') < 0;

            var words = text.split(settings.regExp.dateWords);
            var numbers = text.split(settings.regExp.dateNumbers);

            if (!isDateOnly) {
                //am/pm
                
                isAm = words.indexOf(settings.text.am.toLowerCase()) >= 0 ? true :
                    words.indexOf(settings.text.pm.toLowerCase()) >= 0 ? false : undefined;

                //time with ':'
                for (i = 0; i < numbers.length; i++) {
                var number = numbers[i];
                if (number.indexOf(':') >= 0) {
                    if (hour < 0 || minute < 0) {
                    var parts = number.split(':');
                    for (k = 0; k < Math.min(2, parts.length); k++) {
                        j = parseInt(parts[k]);
                        if (isNaN(j)) {
                        j = 0;
                        }
                        if (k === 0) {
                        hour = j % 24;
                        } else {
                        minute = j % 60;
                        }
                    }
                    }
                    numbers.splice(i, 1);
                }
                }
            }

            if (!isTimeOnly) {
                //textual month
                for (i = 0; i < words.length; i++) {
                    var word = words[i];
                    if (word.length <= 0) {
                        continue;
                    }
                    word = word.substring(0, Math.min(word.length, 3));
                    for (j = 0; j < settings.text.months.length; j++) {
                        var monthString = settings.text.months[j];
                        monthString = monthString.substring(0, Math.min(word.length, Math.min(monthString.length, 3))).toLowerCase();
                        if (monthString === word) {
                            month = j + 1;
                            break;
                        }
                    }
                    if (month >= 0) {
                        break;
                    }
                }

                //year > 59
                for (i = 0; i < numbers.length; i++) {
                    j = parseInt(numbers[i]);
                    if (isNaN(j)) {
                        continue;
                    }
                    if (j > 59) {
                        year = j;
                        numbers.splice(i, 1);
                        break;
                    }
                }

                //numeric month
                if (month < 0) {
                    for (i = 0; i < numbers.length; i++) {
                        k = i > 1 || settings.monthFirst ? i : i === 1 ? 0 : 1;
                        j = parseInt(numbers[k]);
                        if (isNaN(j)) {
                            continue;
                        }
                        if (1 <= j && j <= 12) {
                            month = j;
                            numbers.splice(k, 1);
                            break;
                        }
                    }
                }

                //day
                for (i = 0; i < numbers.length; i++) {
                    j = parseInt(numbers[i]);
                    if (isNaN(j)) {
                        continue;
                    }
                    if (1 <= j && j <= 31) {
                        day = j;
                        numbers.splice(i, 1);
                        break;
                    }
                }

                //year <= 59
                if (year < 0) {
                    for (i = numbers.length - 1; i >= 0; i--) {
                        j = parseInt(numbers[i]);
                        if (isNaN(j)) {
                            continue;
                        }
                        if (j < 99) {
                            j += 2000;
                        }
                        year = j;
                        numbers.splice(i, 1);
                        break;
                    }
                }
            }

            if (!isDateOnly) {
                //hour
                if (hour < 0) {
                    for (i = 0; i < numbers.length; i++) {
                        j = parseInt(numbers[i]);
                        if (isNaN(j)) {
                            continue;
                        }
                        if (0 <= j && j <= 23) {
                            hour = j;
                            numbers.splice(i, 1);
                            break;
                        }
                    }
                }

                //minute
                if (minute < 0) {
                    for (i = 0; i < numbers.length; i++) {
                        j = parseInt(numbers[i]);
                        if (isNaN(j)) {
                            continue;
                        }
                        if (0 <= j && j <= 59) {
                            minute = j;
                            numbers.splice(i, 1);
                            break;
                        }
                    }
                }
            }

            if (minute < 0 && hour < 0 && day < 0 && month < 0 && year < 0) {
                return null;
            }

            if (minute < 0) {
                minute = 0;
            }
            if (hour < 0) {
                hour = 0;
            }
            if (day < 0) {
                day = 1;
            }
            if (month < 0) {
                month = 1;
            }
            if (year < 0) {
                year = new Date().getFullYear();
            }

            if (isAm !== undefined) {
                if (isAm) {
                    if (hour === 12) {
                        hour = 0;
                    }
                } else if (hour < 12) {
                    hour += 12;
                }
            }

            var date = new Date(year, month - 1, day, hour, minute);
            if (date.getMonth() !== month - 1 || date.getFullYear() !== year) {
                //month or year don't match up, switch to last day of the month
                date = new Date(year, month, 0, hour, minute);
            }
            return isNaN(date.getTime()) ? null : date;
        }
    },

    selector: {
        popup: '.ui.popup',
        input: 'input',
        activator: 'input'
    },

    regExp: {
        dateWords: /[^A-Za-z\u00C0-\u024F]+/g,
        dateNumbers: /[^\d:]+/g
    },

    error: {
        popup: 'UI Popup, a required component is not included in this page',
        method: 'The method you called is not defined.'
    },

    className: {
        calendar: 'calendar',
        active: 'active',
        popup: 'ui popup',
        grid: 'ui equal width grid',
        column: 'column',
        table: 'ui celled center aligned unstackable table',
        prev: 'prev link',
        next: 'next link',
        prevIcon: 'chevron left icon',
        nextIcon: 'chevron right icon',
        link: 'link',
        cell: 'link',
        disabledCell: 'disabled',
        adjacentCell: 'adjacent',
        activeCell: 'active',
        rangeCell: 'range',
        focusCell: 'focus',
        todayCell: 'today',
        today: 'today link'
    },

    metadata: {
        date: 'date',
        focusDate: 'focusDate',
        startDate: 'startDate',
        endDate: 'endDate',
        minDate: 'minDate',
        maxDate: 'maxDate',
        mode: 'mode',
        monthOffset: 'monthOffset',
        message: 'message'
    },

    // is the given date disabled?
    isDisabled: function (date, mode) {
        return false;
    },

    events: ['change', 'show', 'visible', 'hide', 'hidden']
}

export class Calendar extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);

        this.$input = this.$element.find(this.settings.selector.input);
        this.$container = this.$element.find(this.settings.selector.popup);
        this.$activator = this.$element.find(this.settings.selector.activator);

        this.isTouchDown = false;
        this.focusDateUsedForRange = false;

        this.timeGap = timeGapTable[this.settings.minTimeGap];
        
        this.initialize();
    }

    initialize() {
        this.verbose('Initializing calendar module', this.settings);

        this.isTouch = this.get_isTouch();
        this.setup_config();
        this.setup_popup();
        this.setup_inline();
        this.setup_input();
        this.setup_date();
        this.create_calendar();

        this.bind_events();
        this.instantiate();
    }

    instantiate() {
        this.verbose('Instantiating module', this.settings);
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.verbose('Destroying previous instance', this);
        this.unbind_events();
        this.$element.removeData(this.moduleNamespace);
    }

    setup_config() {
        if (this.get_minDate() !== null) {
            this.set_minDate(this.$element.data(this.settings.metadata.minDate));
        }
        if (this.get_maxDate() !== null) {
            this.set_maxDate(this.$element.data(this.settings.metadata.maxDate));
        }
    }

    setup_popup() {
        if (this.settings.inline) {
            return;
        }
        if (!this.$activator.length) {
            this.$activator = this.$element.children().first();
            if (!this.$activator.length) {
                return;
            }
        }
        /*
        TODO: check Popup class availability
        if ($.fn.popup === undefined) {
        module.error(error.popup);
        return;
        }
        */
        if (!this.$container.length) {
            //prepend the popup element to the activator's parent so that it has less chance of messing with
            //the styling (eg input action button needs to be the last child to have correct border radius)
            this.$container = $('<div/>').addClass(this.settings.className.popup).prependTo(this.$activator.parent());
        }
        this.$container.addClass(this.settings.className.calendar);
        var
            onVisible = this.settings.onVisible,
            onHidden = this.settings.onHidden,
            module = this
        ;
        if (!this.$input.length) {
            //no input, $container has to handle focus/blur
            this.$container.attr('tabindex', '0');
            onVisible = function () {
                module.focus();
                return this.settings.onVisible.apply($container, arguments);
            };
            onHidden = function () {
                module.blur();
                return this.settings.onHidden.apply($container, arguments);
            };
        }
        var onShow = function () {
            //reset the focus date onShow
            module.set_focusDate(module.get_date());
            module.set_mode(module.settings.startMode);
            // INVESTIGATE
            //return module.settings.onShow.apply($container, arguments);
            return module.invokeCallback('show', arguments);
        };
        var on = this.settings.on || (this.$input.length ? 'focus' : 'click');
        var options = $.extend({}, this.settings.popupOptions, {
            popup: this.$container,
            on: on,
            hoverable: on === 'hover',
            debug: this.settings.debug,
            verbose: this.settings.verbose
            //onShow: onShow,
            //onVisible: onVisible,
            //onHide: this.settings.onHide,
            //onHidden: onHidden
        });

        this.popup = new Popup(this.$activator, options);

        this.popup.on('show', onShow);
    }

    setup_inline() {
        if (this.$activator.length && !this.settings.inline) {
            return;
        }
        this.$container = $('<div/>').addClass(this.settings.className.calendar).appendTo(this.$element);
        if (!this.$input.length) {
            this.$container.attr('tabindex', '0');
        }
    }

    setup_input() {
        if (this.settings.touchReadonly && this.$input.length && this.isTouch) {
            this.$input.prop('readonly', true);
        }
    }

    setup_date() {
        if (this.$input.length) {
            var 
                val = this.$input.val(),
                date = this.settings.parser.date(val, this.settings)
            ;
            this.set_date(date, this.settings.formatInput, false);
        }
    }

    create_calendar() {
        var i, r, c, p, row, cell, pageGrid;

        var mode = this.get_mode(),
            today = new Date(),
            date = this.get_date(),
            focusDate = this.get_focusDate(),
            display = focusDate || date || this.settings.initialDate || today
        ;

        display = this.helper_dateInRange(display);

        if (!focusDate) {
            focusDate = display;
            this.set_focusDate(focusDate, false, false);
        }

        var isYear = mode === 'year';
        var isMonth = mode === 'month';
        var isDay = mode === 'day';
        var isHour = mode === 'hour';
        var isMinute = mode === 'minute';
        var isTimeOnly = this.settings.type === 'time';

        var multiMonth = Math.max(this.settings.multiMonth, 1);
        var monthOffset = !isDay ? 0 : this.get_monthOffset();

        var minute = display.getMinutes();
        var hour = display.getHours();
        var day = display.getDate();
        var startMonth = display.getMonth() + monthOffset;
        var year = display.getFullYear();

        var columns = isDay ? this.settings.showWeekNumbers ? 8 : 7 : isHour ? 4 : this.timeGap['column'];
        var rows = isDay || isHour ? 6 : this.timeGap['row'];
        var pages = isDay ? multiMonth : 1;

        var container = this.$container;
        var tooltipPosition = container.hasClass("left") ? "right center" : "left center";
        container.empty();
        if (pages > 1) {
            pageGrid = $('<div/>').addClass(this.settings.className.grid).appendTo(container);
        }

        for (p = 0; p < pages; p++) {
            if (pages > 1) {
                var pageColumn = $('<div/>').addClass(this.settings.className.column).appendTo(pageGrid);
                container = pageColumn;
            }

            var month = startMonth + p;
            var firstMonthDayColumn = (new Date(year, month, 1).getDay() - this.settings.firstDayOfWeek % 7 + 7) % 7;
            if (!this.settings.constantHeight && isDay) {
                var requiredCells = new Date(year, month + 1, 0).getDate() + firstMonthDayColumn;
                rows = Math.ceil(requiredCells / 7);
            }

            var yearChange = isYear ? 10 : isMonth ? 1 : 0;
            var monthChange = isDay ? 1 : 0;
            var dayChange = isHour || isMinute ? 1 : 0;
            var prevNextDay = isHour || isMinute ? day : 1;
            var prevDate = new Date(year - yearChange, month - monthChange, prevNextDay - dayChange, hour);
            var nextDate = new Date(year + yearChange, month + monthChange, prevNextDay + dayChange, hour);

            var prevLast = isYear ? new Date(Math.ceil(year / 10) * 10 - 9, 0, 0) :
            isMonth ? new Date(year, 0, 0) : isDay ? new Date(year, month, 0) : new Date(year, month, day, -1);
            var nextFirst = isYear ? new Date(Math.ceil(year / 10) * 10 + 1, 0, 1) :
            isMonth ? new Date(year + 1, 0, 1) : isDay ? new Date(year, month + 1, 1) : new Date(year, month, day + 1);

            var tempMode = mode;
            if (isDay && this.settings.showWeekNumbers) {
                tempMode += ' andweek';
            }
            var table = $('<table/>').addClass(this.settings.className.table).addClass(tempMode).appendTo(container);
            var textColumns = columns;
            //no header for time-only mode
            if (!isTimeOnly) {
                var thead = $('<thead/>').appendTo(table);

                row = $('<tr/>').appendTo(thead);
                cell = $('<th/>').attr('colspan', '' + columns).appendTo(row);

                var headerDate = isYear || isMonth ? new Date(year, 0, 1) :
                    isDay ? new Date(year, month, 1) : new Date(year, month, day, hour, minute);
                var headerText = $('<span/>').addClass(this.settings.className.link).appendTo(cell);
                headerText.text(this.settings.formatter.header(headerDate, mode, this.settings));
                var newMode = isMonth ? (this.settings.disableYear ? 'day' : 'year') :
                    isDay ? (this.settings.disableMonth ? 'year' : 'month') : 'day';
                headerText.data(this.settings.metadata.mode, newMode);

                if (p === 0) {
                    var prev = $('<span/>').addClass(this.settings.className.prev).appendTo(cell);
                    prev.data(this.settings.metadata.focusDate, prevDate);
                    prev.toggleClass(this.settings.className.disabledCell, !this.helper_isDateInRange(prevLast, mode));
                    $('<i/>').addClass(this.settings.className.prevIcon).appendTo(prev);
                }

                if (p === pages - 1) {
                    var next = $('<span/>').addClass(this.settings.className.next).appendTo(cell);
                    next.data(this.settings.metadata.focusDate, nextDate);
                    next.toggleClass(this.settings.className.disabledCell, !this.helper_isDateInRange(nextFirst, mode));
                    $('<i/>').addClass(this.settings.className.nextIcon).appendTo(next);
                }
                if (isDay) {
                    row = $('<tr/>').appendTo(thead);
                    if(this.settings.showWeekNumbers) {
                        cell = $('<th/>').appendTo(row);
                        cell.text(this.settings.text.weekNo);
                        cell.addClass(this.settings.className.disabledCell);
                        textColumns--;
                    }
                    for (i = 0; i < textColumns; i++) {
                        cell = $('<th/>').appendTo(row);
                        cell.text(this.settings.formatter.dayColumnHeader((i + this.settings.firstDayOfWeek) % 7, this.settings));
                    }
                }
            }

            var tbody = $('<tbody/>').appendTo(table);
            i = isYear ? Math.ceil(year / 10) * 10 - 9 : isDay ? 1 - firstMonthDayColumn : 0;
            for (r = 0; r < rows; r++) {
                row = $('<tr/>').appendTo(tbody);
                if(isDay && this.settings.showWeekNumbers){
                    cell = $('<th/>').appendTo(row);
                    cell.text(this.get_weekOfYear(year, month, i+1-this.settings.firstDayOfWeek));
                    cell.addClass(this.settings.className.disabledCell);
                }
                for (c = 0; c < textColumns; c++, i++) {
                    var cellDate = isYear ? new Date(i, month, 1, hour, minute) :
                    isMonth ? new Date(year, i, 1, hour, minute) : isDay ? new Date(year, month, i, hour, minute) :
                        isHour ? new Date(year, month, day, i) : new Date(year, month, day, hour, i * this.settings.minTimeGap);
                    var cellText = isYear ? i :
                    isMonth ? this.settings.text.monthsShort[i] : isDay ? cellDate.getDate() :
                        this.settings.formatter.time(cellDate, settings, true);
                    cell = $('<td/>').addClass(this.settings.className.cell).appendTo(row);
                    cell.text(cellText);
                    cell.data(this.settings.metadata.date, cellDate);
                    var adjacent = isDay && cellDate.getMonth() !== ((month + 12) % 12);
                    var disabled = adjacent || !this.helper_isDateInRange(cellDate, mode) || this.settings.isDisabled(cellDate, mode) || this.helper_isDisabled(cellDate, mode);
                    if (disabled) {
                        var disabledReason = this.helper_disabledReason(cellDate, mode);
                        if (disabledReason !== null) {
                            cell.attr("data-tooltip", disabledReason[this.settings.metadata.message]);
                            cell.attr("data-position", tooltipPosition);
                        }
                    }
                    var active = this.helper_dateEqual(cellDate, date, mode);
                    var isToday = this.helper_dateEqual(cellDate, today, mode);
                    cell.toggleClass(this.settings.className.adjacentCell, adjacent);
                    cell.toggleClass(this.settings.className.disabledCell, disabled);
                    cell.toggleClass(this.settings.className.activeCell, active && !adjacent);
                    if (!isHour && !isMinute) {
                        cell.toggleClass(this.settings.className.todayCell, !adjacent && isToday);
                    }

                    // Allow for external modifications of each cell
                    var cellOptions = {
                        mode: mode,
                        adjacent: adjacent,
                        disabled: disabled,
                        active: active,
                        today: isToday
                    };
                    this.settings.formatter.cell(cell, cellDate, cellOptions);

                    if (this.helper_dateEqual(cellDate, focusDate, mode)) {
                        //ensure that the focus date is exactly equal to the cell date
                        //so that, if selected, the correct value is set
                        this.set_focusDate(cellDate, false, false);
                    }
                }
            }

            if (this.settings.today) {
                var todayRow = $('<tr/>').appendTo(tbody);
                var todayButton = $('<td/>').attr('colspan', '' + columns).addClass(this.settings.className.today).appendTo(todayRow);
                todayButton.text(this.settings.formatter.today(settings));
                todayButton.data(this.settings.metadata.date, today);
            }

            this.update_focus(false, table);
        }
    }

    bind_events() {
        this.debug('Binding events');
        this.$container.on('mousedown' + this.eventNamespace, this.event_mousedown.bind(this));
        this.$container.on('touchstart' + this.eventNamespace, this.event_mousedown.bind(this));
        this.$container.on('mouseup' + this.eventNamespace, this.event_mouseup.bind(this));
        this.$container.on('touchend' + this.eventNamespace, this.event_mouseup.bind(this));
        this.$container.on('mouseover' + this.eventNamespace, this.event_mouseover.bind(this));
        if (this.$input.length) {
            this.$input.on('input' + this.eventNamespace, this.event_inputChange.bind(this));
            this.$input.on('focus' + this.eventNamespace, this.event_inputFocus.bind(this));
            this.$input.on('blur' + this.eventNamespace, this.event_inputBlur.bind(this));
            this.$input.on('click' + this.eventNamespace, this.event_inputClick.bind(this));
            this.$input.on('keydown' + this.eventNamespace, this.event_keydown.bind(this));
        } else {
            this.$container.on('keydown' + this.eventNamespace, this.event_keydown.bind(this));
        }
    }

    unbind_events() {
        this.debug('Unbinding events');
        this.$container.off(this.eventNamespace);
        if (this.$input.length) {
            this.$input.off(this.eventNamespace);
        }
    }

    event_mousedown(event) {
        if (this.$input.length) {
            //prevent the mousedown on the calendar causing the input to lose focus
            event.preventDefault();
        }
        this.isTouchDown = event.type.indexOf('touch') >= 0;
        var target = $(event.target);
        var date = target.data(this.settings.metadata.date);
        if (date) {
            this.set_focusDate(date, false, true, true);
        }
    }

    event_mouseup(event) {
        //ensure input has focus so that it receives keydown events for calendar navigation
        this.focus();
        event.preventDefault();
        event.stopPropagation();
        this.isTouchDown = false;
        var target = $(event.target);
        if (target.hasClass("disabled")) {
            return;
        }
        var parent = target.parent();
        if (parent.data(this.settings.metadata.date) || parent.data(this.settings.metadata.focusDate) || parent.data(this.settings.metadata.mode)) {
            //clicked on a child element, switch to parent (used when clicking directly on prev/next <i> icon element)
            target = parent;
        }
        var date = target.data(this.settings.metadata.date);
        var focusDate = target.data(this.settings.metadata.focusDate);
        var mode = target.data(this.settings.metadata.mode);
        if (date) {
            var forceSet = target.hasClass(this.settings.className.today);
            this.selectDate(date, forceSet);
        } else if (focusDate) {
            this.set_focusDate(focusDate);
        } else if (mode) {
            this.set_mode(mode);
        }
    }

    event_mouseover(event) {
        var target = $(event.target);
        var date = target.data(this.settings.metadata.date);
        var mousedown = event.buttons === 1;
        if (date) {
            this.set_focusDate(date, false, true, mousedown);
        }
    }

    event_inputChange() {
        var val = this.$input.val();
        var date = this.settings.parser.date(val, this.settings);
        this.set_date(date, false);
    }

    event_inputFocus() {
        this.$container.addClass(this.settings.className.active);
    }

    event_inputBlur() {
        this.$container.removeClass(this.settings.className.active);
        if (this.settings.formatInput) {
            var date = this.get_date();
            var text = this.settings.formatter.datetime(date, this.settings);
            this.$input.val(text);
        }
    }

    event_inputClick(event) {
        //this.popup.show();
    }

    event_keydown(event) {
        if (event.keyCode === 27 || event.keyCode === 9) {
            //esc || tab
            this.popup.hide();
        }

        if (this.popup.is_visible()) {
            if (event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40) {
                //arrow keys
                var mode = this.get_mode();
                var bigIncrement = mode === 'day' ? 7 : mode === 'hour' ? 4 : mode === 'minute' ? this.timeGap['column'] : 3;
                var increment = event.keyCode === 37 ? -1 : event.keyCode === 38 ? -bigIncrement : event.keyCode == 39 ? 1 : bigIncrement;
                increment *= mode === 'minute' ? this.settings.minTimeGap : 1;
                var focusDate = this.get_focusDate() || this.get_date() || new Date();
                var year = focusDate.getFullYear() + (mode === 'year' ? increment : 0);
                var month = focusDate.getMonth() + (mode === 'month' ? increment : 0);
                var day = focusDate.getDate() + (mode === 'day' ? increment : 0);
                var hour = focusDate.getHours() + (mode === 'hour' ? increment : 0);
                var minute = focusDate.getMinutes() + (mode === 'minute' ? increment : 0);
                var newFocusDate = new Date(year, month, day, hour, minute);
                if (this.settings.type === 'time') {
                    newFocusDate = this.helper_mergeDateTime(focusDate, newFocusDate);
                }
                if (this.helper_isDateInRange(newFocusDate, mode)) {
                    this.set_focusDate(newFocusDate);
                }
            } else if (event.keyCode === 13) {
                //enter
                var mode = this.get_mode();
                var date = this.get_focusDate();
                if (date && !this.settings.isDisabled(date, mode) && !this.helper_isDisabled(date, mode)) {
                    this.selectDate(date);
                }
                //disable form submission:
                event.preventDefault();
                event.stopPropagation();
            }
        }

        if (event.keyCode === 38 || event.keyCode === 40) {
            //arrow-up || arrow-down
            event.preventDefault(); //don't scroll
            this.popup.show();
        }
    }

    update_focus(updateRange, container) {
        container = container || this.$container;
        var
            mode = this.get_mode(),
            date = this.get_date(),
            focusDate = this.get_focusDate(),
            startDate = this.get_startDate(),
            endDate = this.get_endDate(),
            rangeDate = (updateRange ? focusDate : null) || date || (!this.isTouch ? focusDate : null),
            module = this    
        ;

        container.find('td').each(function () {
            var
                cell = $(this),
                cellDate = cell.data(module.settings.metadata.date)
            ;
            if (!cellDate) {
                return;
            }
            var
                disabled = cell.hasClass(module.settings.className.disabledCell),
                active = cell.hasClass(module.settings.className.activeCell),
                adjacent = cell.hasClass(module.settings.className.adjacentCell),
                focused = module.helper_dateEqual(cellDate, focusDate, mode),
                inRange = !rangeDate ? false :
            ((!!startDate && module.helper_isDateInRange(cellDate, mode, startDate, rangeDate)) ||
            (!!endDate && module.helper_isDateInRange(cellDate, mode, rangeDate, endDate)));
            cell.toggleClass(module.settings.className.focusCell, focused && (!module.isTouch || module.isTouchDown) && !adjacent && !disabled);
            cell.toggleClass(module.settings.className.rangeCell, inRange && !active && !disabled);
        });
    }

    focus() {
        /* TODO
        if (this.$input.length) {
            this.$input.focus();
        } else {
            this.$container.focus();
        }*/
    }
    
    blur() {
        /* TODO
        if (this.$input.length) {
            this.$input.blur();
        } else {
            this.$container.blur();
        }*/
    }

    clear() {
        this.set_date(undefined);
    }

    selectDate(date, forceSet) {
        this.verbose('New date selection', date);
        var mode = this.get_mode();
        var complete = forceSet || mode === 'minute' ||
        (this.settings.disableMinute && mode === 'hour') ||
        (this.settings.type === 'date' && mode === 'day') ||
        (this.settings.type === 'month' && mode === 'month') ||
        (this.settings.type === 'year' && mode === 'year');
        if (complete) {
            var canceled = this.set_date(date) === false;
            if (!canceled && this.settings.closable) {
                this.popup.hide();
                //if this is a range calendar, show the end date calendar popup and focus the input
                if (this.settings.endCalendar) {
                    this.settings.endCalendar.popup.show();
                    //endModule.focus();
                }
            }
        } else {
            var newMode = mode === 'year' ? (!this.settings.disableMonth ? 'month' : 'day') :
                mode === 'month' ? 'day' : mode === 'day' ? 'hour' : 'minute';
            this.set_mode(newMode);
            if (mode === 'hour' || (mode === 'day' && this.get_date())) {
                //the user has chosen enough to consider a valid date/time has been chosen
                this.set_date(date);
            } else {
                this.set_focusDate(date);
            }
        }
    }

    refresh() {
        this.create_calendar();
    }

    get_calendarModule(selector) {
        if (!selector) {
            return null;
          }
          if (!(selector instanceof $)) {
            selector = this.$element.parent().children(selector).first();
          }
          //assume range related calendars are using the same namespace
          return selector.data(this.moduleNamespace);
    }

    get_date() {
        return this.$element.data(this.settings.metadata.date) || null;
    }

    get_endDate() {
        return (this.settings.endCalendar ? this.settings.endCalendar.get_date() : this.$element.data(this.settings.metadata.endDate)) || null;
    }

    get_focusDate() {
        return this.$element.data(this.settings.metadata.focusDate) || null;
    }

    get_isTouch() {
        try {
            document.createEvent('TouchEvent');
            return true;
        } catch (e) {
            return false;
        }
    }

    get_maxDate() {
        return this.$element.data(this.settings.metadata.maxDate) || null;
    }

    get_minDate() {
        return this.$element.data(this.settings.metadata.minDate) || null;
    }

    get_mode() {
        //only returns valid modes for the current settings
        var mode = this.$element.data(this.settings.metadata.mode) || this.settings.startMode;
        var validModes = this.get_validModes();
        
        //if ($.inArray(mode, validModes) >= 0) {
        if (validModes.indexOf(mode) >= 0) {
            return mode;
        }
        return this.settings.type === 'time' ? 'hour' :
          this.settings.type === 'month' ? 'month' :
            this.settings.type === 'year' ? 'year' : 'day';
    }

    get_monthOffset() {
        return this.$element.data(this.settings.metadata.monthOffset) || 0;
    }

    get_startDate() {
        return (this.settings.startCalendar ? this.settings.startCalendar.get_date() : this.$element.data(this.settings.metadata.startDate)) || null;
    }

    get_validModes() {
        var validModes = [];
        if (this.settings.type !== 'time') {
            if (!this.settings.disableYear || this.settings.type === 'year') {
                validModes.push('year');
            }
            if (!(this.settings.disableMonth || this.settings.type === 'year') || this.settings.type === 'month') {
                validModes.push('month');
            }
            if (this.settings.type.indexOf('date') >= 0) {
                validModes.push('day');
            }
        }
        if (this.settings.type.indexOf('time') >= 0) {
            validModes.push('hour');
            if (!this.settings.disableMinute) {
                validModes.push('minute');
            }
        }
        return validModes;
    }

    get_weekOfYear(weekYear, weekMonth, weekDay) {
        // adapted from http://www.merlyn.demon.co.uk/weekcalc.htm
        var ms1d = 864e5, // milliseconds in a day
        ms7d = 7 * ms1d; // milliseconds in a week

        return function() { // return a closure so constants get calculated only once
        var DC3 = Date.UTC(weekYear, weekMonth, weekDay + 3) / ms1d, // an Absolute Day Number
            AWN = Math.floor(DC3 / 7), // an Absolute Week Number
            Wyr = new Date(AWN * ms7d).getUTCFullYear();

        return AWN - Math.floor(Date.UTC(Wyr, 0, 7) / ms7d) + 1;
        }();
    }

    set_dataKeyValue(key, value, refreshCalendar) {
        var oldValue = this.$element.data(key);
        var equal = oldValue === value || (oldValue <= value && oldValue >= value); //equality test for dates and string objects
        if (value) {
            this.$element.data(key, value);
        } else {
            this.$element.removeData(key);
        }
        refreshCalendar = refreshCalendar !== false && !equal;
        if (refreshCalendar) {
            this.refresh();
        }
        return !equal;
    }

    set_date(date, updateInput, fireChange) {
        updateInput = updateInput !== false;
        fireChange = fireChange !== false;
        date = this.helper_sanitiseDate(date);
        date = this.helper_dateInRange(date);

        var mode = this.get_mode();
        var text = this.settings.formatter.datetime(date, settings);
        // if (fireChange && this.settings.onChange.call(element, date, text, mode) === false) {
        if (fireChange && this.invokeCallback('change')(this.element, date, text, mode) === false) {
            return false;
        }

        this.set_focusDate(date);

        if (this.settings.isDisabled(date, mode)) {
            return false;
        }

        var endDate = this.get_endDate();
        if (!!endDate && !!date && date > endDate) {
            //selected date is greater than end date in range, so clear end date
            this.set_endDate(undefined);
        }
        this.set_dataKeyValue(this.settings.metadata.date, date);

        if (updateInput && this.$input.length) {
            this.$input.val(text);
        }
    }

    set_endDate(date, refreshCalendar) {
        date = this.helper_sanitiseDate(date);

        if (this.settings.endCalendar) {
            this.settings.endCalendar.set_date(date);
        }

        this.set_dataKeyValue(this.settings.metadata.endDate, date, refreshCalendar);
    }

    set_focusDate(date, refreshCalendar, updateFocus, updateRange) {
        date = this.helper_sanitiseDate(date);
        date = this.helper_dateInRange(date);
        var isDay = this.get_mode() === 'day';
        var oldFocusDate = this.get_focusDate();
        if (isDay && date && oldFocusDate) {
            var yearDelta = date.getFullYear() - oldFocusDate.getFullYear();
            var monthDelta = yearDelta * 12 + date.getMonth() - oldFocusDate.getMonth();
            if (monthDelta) {
                var monthOffset = this.get_monthOffset() - monthDelta;
                this.set_monthOffset(monthOffset, false);
            }
        }
        var changed = this.set_dataKeyValue(this.settings.metadata.focusDate, date, refreshCalendar);
        updateFocus = (updateFocus !== false && changed && refreshCalendar === false) || this.focusDateUsedForRange != updateRange;
        this.focusDateUsedForRange = updateRange;
        if (updateFocus) {
            this.update_focus(updateRange);
        }
    }

    set_maxDate(date) {
        date = this.helper_sanitiseDate(date);
        if (this.settings.minDate !== null && this.settings.minDate >= date) {
            this.verbose('Unable to set maxDate variable lower that minDate variable', date, this.settings.minDate);
        } else {
            //module.setting('maxDate', date);
            this.setting.maxDate = date;
            this.set_dataKeyValue(this.settings.metadata.maxDate, date);
        }
    }

    set_minDate(date) {
        date = this.helper_sanitiseDate(date);
        if (this.settings.maxDate !== null && this.settings.maxDate <= date) {
            this.verbose('Unable to set minDate variable bigger that maxDate variable', date, this.settings.maxDate);
        } else {
            //module.setting('minDate', date);
            this.setting.minDate = date;
            this.set_dataKeyValue(this.settings.metadata.minDate, date);
        }
    }

    set_mode(mode, refreshCalendar) {
        this.set_dataKeyValue(this.settings.metadata.mode, mode, refreshCalendar);
    }

    set_monthOffset(monthOffset, refreshCalendar) {
        var multiMonth = Math.max(this.settings.multiMonth, 1);
        monthOffset = Math.max(1 - multiMonth, Math.min(0, monthOffset));
        this.set_dataKeyValue(this.settings.metadata.monthOffset, monthOffset, refreshCalendar);
    }

    helper_dateDiff(date1, date2, mode) {
        mode = mode || 'day';
        var isTimeOnly = this.settings.type === 'time';
        var isYear = mode === 'year';
        var isYearOrMonth = isYear || mode === 'month';
        var isMinute = mode === 'minute';
        var isHourOrMinute = isMinute || mode === 'hour';
        //only care about a minute accuracy of this.settings.minTimeGap
        date1 = new Date(
            isTimeOnly ? 2000 : date1.getFullYear(),
            isTimeOnly ? 0 : isYear ? 0 : date1.getMonth(),
            isTimeOnly ? 1 : isYearOrMonth ? 1 : date1.getDate(),
            !isHourOrMinute ? 0 : date1.getHours(),
            !isMinute ? 0 : this.settings.minTimeGap * Math.floor(date1.getMinutes() / this.settings.minTimeGap));
        date2 = new Date(
            isTimeOnly ? 2000 : date2.getFullYear(),
            isTimeOnly ? 0 : isYear ? 0 : date2.getMonth(),
            isTimeOnly ? 1 : isYearOrMonth ? 1 : date2.getDate(),
            !isHourOrMinute ? 0 : date2.getHours(),
            !isMinute ? 0 : this.settings.minTimeGap * Math.floor(date2.getMinutes() / this.settings.minTimeGap));
        return date2.getTime() - date1.getTime();
    }

    helper_dateEqual(date1, date2, mode) {
        return !!date1 && !!date2 && this.helper_dateDiff(date1, date2, mode) === 0;
    }

    helper_dateInRange(date, minDate, maxDate) {
        if (!minDate && !maxDate) {
            var startDate = this.get_startDate();
            minDate = startDate && this.settings.minDate ? new Date(Math.max(startDate, this.settings.minDate)) : startDate || this.settings.minDate;
            maxDate = this.settings.maxDate;
        }
        minDate = minDate && new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), minDate.getHours(), this.settings.minTimeGap * Math.ceil(minDate.getMinutes() / this.settings.minTimeGap));
        var isTimeOnly = this.settings.type === 'time';
        return !date ? date :
            (minDate && this.helper_dateDiff(date, minDate, 'minute') > 0) ?
              (isTimeOnly ? this.helper_mergeDateTime(date, minDate) : minDate) :
              (maxDate && this.helper_dateDiff(maxDate, date, 'minute') > 0) ?
                (isTimeOnly ? this.helper_mergeDateTime(date, maxDate) : maxDate) :
                date;
    }

    helper_disabledReason(date, mode) {
        if (mode === 'day') {
            for (var i = 0; i < this.settings.disabledDates.length; i++) {
                var d = this.settings.disabledDates[i];
                if (d !== null && typeof d === 'object' && this.helper_dateEqual(date, d[this.settings.metadata.date], mode)) {
                    var reason = {};
                    reason[this.settings.metadata.message] = d[this.settings.metadata.message];
                    return reason;
                }
            }
        }
        return null;
    }

    helper_isDateInRange(date, mode, minDate, maxDate) {
        if (!minDate && !maxDate) {
            var startDate = this.get_startDate();
            minDate = startDate && this.settings.minDate ? new Date(Math.max(startDate, this.settings.minDate)) : startDate || this.settings.minDate;
            maxDate = this.settings.maxDate;
        }
        minDate = minDate && new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), minDate.getHours(), this.settings.minTimeGap * Math.ceil(minDate.getMinutes() / this.settings.minTimeGap));
        return !(!date ||
        (minDate && this.helper_dateDiff(date, minDate, mode) > 0) ||
        (maxDate && this.helper_dateDiff(maxDate, date, mode) > 0));
    }

    helper_isDisabled(date, mode) {
        var module = this;
        return mode === 'day' && ((this.settings.disabledDaysOfWeek.indexOf(date.getDay()) !== -1) || this.settings.disabledDates.some(function(d){
            if (d instanceof Date) {
                return module.helper_dateEqual(date, d, mode);
            }
            if (d !== null && typeof d === 'object') {
                return module.helper_dateEqual(date, d[this.settings.metadata.date], mode);
            }
        }));
    }

    helper_mergeDateTime(date, time) {
        return (!date || !time)
            ? time
            : new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes())
        ;
    }

    helper_sanitiseDate(date) {
        if (!date) {
            return undefined;
        }
        if (!(date instanceof Date)) {
            date = this.settings.parser.date('' + date, this.settings);
        }
        if (isNaN(date.getTime())) {
            return undefined;
        }
        return date;
    }
}
