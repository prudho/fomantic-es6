"use strict";

import Module from '../module';

import { Popup } from './popup';

import $, { Cash } from 'cash-dom';

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
  enabledDates       : [],         // specific day(s) which will be selectable, all other days will be disabled
  eventDates         : [],         // specific day(s) which will be shown in a different color and using tooltips
  centuryBreak       : 60,         // starting short year until 99 where it will be assumed to belong to the last century
  currentCentury     : 2000,       // century to be added to 2-digit years (00 to {centuryBreak}-1)
  selectAdjacentDays : false,     // The calendar can show dates from adjacent month. These adjacent month dates can also be made selectable.
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
      if (text instanceof Date) {
        return text;
      }
      if (!text) {
        return null;
      }
      text = String(text).trim();
      if (text.length === 0) {
        return null;
      }
      if (text.match(/^[0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2}$/)) {
        text = text.replace(/[\/\-\.]/g,'/') + ' 00:00:00';
      }
      // Reverse date and month in some cases
      text = settings.monthFirst || !text.match(/^[0-9]{1,2}[\/\-\.]/) ? text : text.replace(/[\/\-\.]/g,'/').replace(/([0-9]+)\/([0-9]+)/,'$2/$1');
      var textDate = new Date(text);
      var numberOnly = text.match(/^[0-9]+$/) !== null;
      if (!numberOnly && !isNaN(textDate.getDate())) {
        return textDate;
      }
      text = text.toLowerCase();

      var i, j, k;
      var minute = -1, hour = -1, day = -1, month = -1, year = -1;
      var isAm = undefined;

      var isTimeOnly = settings.type === 'time';
      var isDateOnly = settings.type.indexOf('time') < 0;

      var words = text.split(settings.regExp.dateWords), word;
      var numbers = text.split(settings.regExp.dateNumbers), number;

      var parts;
      var monthString;

      if (!isDateOnly) {
        //am/pm
        // isAm = $.inArray(settings.text.am.toLowerCase(), words) >= 0 ? true :
        //   $.inArray(settings.text.pm.toLowerCase(), words) >= 0 ? false : undefined;
        isAm = words.indexOf(settings.text.am.toLowerCase()) >= 0 ? true :
        words.indexOf(settings.text.pm.toLowerCase()) >= 0 ? false : undefined;

        //time with ':'
        for (i = 0; i < numbers.length; i++) {
          number = numbers[i];
          if (number.indexOf(':') >= 0) {
            if (hour < 0 || minute < 0) {
              parts = number.split(':');
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
          word = words[i];
          if (word.length <= 0) {
            continue;
          }
          for (j = 0; j < settings.text.months.length; j++) {
            monthString = settings.text.months[j];
            monthString = monthString.substring(0, word.length).toLowerCase();
            if (monthString === word) {
              month = j + 1;
              break;
            }
          }
          if (month >= 0) {
            break;
          }
        }

        //year > settings.centuryBreak
        for (i = 0; i < numbers.length; i++) {
          j = parseInt(numbers[i]);
          if (isNaN(j)) {
            continue;
          }
          if (j >= settings.centuryBreak && i === numbers.length-1) {
            if (j <= 99) {
              j += settings.currentCentury - 100;
            }
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

        //year <= settings.centuryBreak
        if (year < 0) {
          for (i = numbers.length - 1; i >= 0; i--) {
            j = parseInt(numbers[i]);
            if (isNaN(j)) {
              continue;
            }
            if (j <= 99) {
              j += settings.currentCentury;
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
    activator: 'input',
    append: '.inline.field,.inline.fields'
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
    inverted: 'inverted',
    prev: 'prev link',
    next: 'next link',
    prevIcon: 'chevron left icon',
    nextIcon: 'chevron right icon',
    link: 'link',
    cell: 'link',
    disabledCell: 'disabled',
    weekCell: 'disabled',
    adjacentCell: 'adjacent',
    activeCell: 'active',
    rangeCell: 'range',
    focusCell: 'focus',
    todayCell: 'today',
    today: 'today link',
    disabled: 'disabled'
  },

  metadata: {
    date: 'date',
    focusDate: 'focusDate',
    startDate: 'startDate',
    endDate: 'endDate',
    minDate: 'minDate',
    maxDate: 'maxDate',
    mode: 'mode',
    type: 'type',
    monthOffset: 'monthOffset',
    message: 'message',
    class: 'class',
    inverted: 'inverted',
    variation: 'variation',
    position: 'position',
    month: 'month',
    year: 'year'
  },

  eventClass: 'blue',

  events: [
    'beforeChange', // callback before date is changed, return false to cancel the change
    'change',       // callback when date changes
    'show',         // callback before show animation, return false to prevent show
    'visible',      // callback after show animation
    'hide',         // callback before hide animation, return false to prevent hide
    'hidden',       // callback after hide animation
    'select',       // callback before item is selected, return false to prevent selection
    'disabled'      // is the given date disabled?
  ]
}

const numberText = ['','one','two','three','four','five','six','seven','eight'];

const timeGapTable = {
  '5': {'row': 4, 'column': 3 },
  '10': {'row': 3, 'column': 2 },
  '15': {'row': 2, 'column': 2 },
  '20': {'row': 3, 'column': 1 },
  '30': {'row': 2, 'column': 1 }
};

export default class Calendar extends Module {
  $input: Cash;
  $activator: Cash;
  $container: Cash;

  isTouch: boolean;
  isTouchDown: boolean = false;
  isInverted: boolean;
  focusDateUsedForRange: boolean = false;
  selectionComplete: boolean = false;
  timeGap;

  classObserver: MutationObserver;

  instance: Calendar;
  popup: Popup;

  constructor(selector: string, parameters) {
    super(selector, parameters, settings);

    this.$input = this.$element.find(this.settings.selector.input);
    this.$activator = this.$element.find(this.settings.selector.activator);
    this.$container = this.$element.find(this.settings.selector.popup);

    this.isInverted = this.$element.hasClass(this.settings.className.inverted);
    this.timeGap = timeGapTable[this.settings.minTimeGap],
    
    this.initialize();
  }

  initialize(): void {
    this.debug('Initializing calendar for', this.element, this.$element);
  
    this.isTouch = this.get_isTouch();
    this.setup_config();
    this.setup_popup();
    this.setup_inline();
    this.setup_input();
    this.setup_date();
    this.create_calendar();

    this.bind_events();
    this.observeChanges();
    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance of calendar');
    this.instance = this;
    this.$element.data(this.moduleNamespace, this.instance);
  }

  destroy(): void {
    this.verbose('Destroying previous calendar for', this.element);
    this.$element.removeAttr(this.moduleNamespace);
    this.unbind_events();
    this.disconnect_classObserver();
  }

  setup_config(): void {
    if (this.get_minDate() !== null) {
      this.set_minDate(this.$element.data(this.settings.metadata.minDate));
    }
    if (this.get_maxDate() !== null) {
      this.set_maxDate(this.$element.data(this.settings.metadata.maxDate));
    }
    this.setting('type', this.get_type());
    this.setting('on', this.settings.on || (this.$input.length ? 'focus' : 'click'));
  }

  setup_popup(): void {
    if (this.settings.inline) {
      return;
    }
    if (!this.$activator.length) {
      this.$activator = this.$element.children().first();
      if (!this.$activator.length) {
        return;
      }
    }
    // INVESTIGATE
    // if ($.fn.popup === undefined) {
    //   this.error(this.settings.error.popup);
    //   return;
    // }
    if (!this.$container.length) {
      //prepend the popup element to the activator's parent so that it has less chance of messing with
      //the styling (eg input action button needs to be the last child to have correct border radius)
      let
        $activatorParent = this.$activator.parent(),
        domPositionFunction = $activatorParent.closest(this.settings.selector.append).length !== 0 ? 'appendTo' : 'prependTo'
      ;
      this.$container = $('<div/>').addClass(this.settings.className.popup)[domPositionFunction]($activatorParent);
    }
    this.$container.addClass(this.settings.className.calendar);
    if (this.isInverted) {
      this.$container.addClass(this.settings.className.inverted);
    }
    let
      onVisible = () => {
        this.refreshTooltips();
        // return this.settings.onVisible.apply(this.$container, arguments);
        return this.invokeCallback('visible').apply(this.$container, arguments);
      },
      onHidden = this.settings.onHidden
    ;
    if (!this.$input.length) {
      //no input, $container has to handle focus/blur
      this.$container.attr('tabindex', '0');
      onVisible = () => {
        this.refreshTooltips();
        this.focus();
        // return this.settings.onVisible.apply(this.$container, arguments);
        return this.invokeCallback('visible').apply(this.$container, arguments)
      };
      onHidden = () => {
        this.blur();
        // return this.settings.onHidden.apply(this.$container, arguments);
        return this.invokeCallback('hidden').apply(this.$container, arguments)
      };
    }

    let
      on = this.setting('on'),
      options = $.extend({}, this.settings.popupOptions, {
      popup: this.$container,
      on: on,
      hoverable: on === 'hover',
      closable: on === 'click'
    });
    
    //this.popup(options);

    this.popup = new Popup(this.settings.selector.activator, options);

    this.popup.on('show', () => {
      //reset the focus date onShow
      this.set_focusDate(this.get_date());
      this.set_mode(this.get_validatedMode(this.settings.startMode));
      // return this.settings.onShow.apply(this.$container, arguments);
      return this.invokeCallback('show').apply(this.$container, arguments)
    });

    this.popup.on('visible', onVisible);
    this.popup.on('hide', this.invokeCallback('hide'));
    this.popup.on('hidden', onHidden);
  }

  setup_inline(): void {
    if (this.$activator.length && !this.settings.inline) {
      return;
    }
    this.settings.inline = true;
    this.$container = $('<div/>').addClass(this.settings.className.calendar).appendTo(this.$element);
    if (!this.$input.length) {
      this.$container.attr('tabindex', '0');
    }
  }

  setup_input(): void {
    if (this.settings.touchReadonly && this.$input.length && this.isTouch) {
      this.$input.prop('readonly', true);
    }
    this.check_disabled();
  }

  setup_date(): void {
    let date;
    if (this.settings.initialDate) {
      date = this.settings.parser.date(this.settings.initialDate, this.settings);
    } else if (this.$element.data(this.settings.metadata.date) !== undefined) {
      date = this.settings.parser.date(this.$element.data(this.settings.metadata.date), this.settings);
    } else if (this.$input.length) {
      date = this.settings.parser.date(this.$input.val(), this.settings);
    }
    this.set_date(date, this.settings.formatInput, false);
    this.set_mode(this.get_mode(), false);
  }

  create_calendar(): void {
    let i, row, cell, pageGrid;
  
    let
      mode = this.get_mode(),
      today = new Date(),
      date = this.get_date(),
      focusDate = this.get_focusDate(),
      display = this.helper_sanitiseDate(this.helper_dateInRange(focusDate || date || this.settings.initialDate || today))
    ;

    if (!focusDate) {
      focusDate = display;
      this.set_focusDate(focusDate, false, false);
    }

    let
      isYear = mode === 'year',
      isMonth = mode === 'month',
      isDay = mode === 'day',
      isHour = mode === 'hour',
      isMinute = mode === 'minute',
      isTimeOnly = this.settings.type === 'time'
    ;

    let
      multiMonth = Math.max(this.settings.multiMonth, 1),
      monthOffset = !isDay ? 0 : this.get_monthOffset()
    ;

    let
      minute = display.getMinutes(),
      hour = display.getHours(),
      day = display.getDate(),
      startMonth = display.getMonth() + monthOffset,
      year = display.getFullYear()
    ;

    let
      columns = isDay ? settings.showWeekNumbers ? 8 : 7 : isHour ? 4 : this.timeGap['column'],
      rows = isDay || isHour ? 6 : this.timeGap['row'],
      pages = isDay ? multiMonth : 1
    ;

    let
      container = this.$container,
      tooltipPosition = container.hasClass("left") ? "right center" : "left center"
    ;

    container.empty();

    if (pages > 1) {
      pageGrid = $('<div/>').addClass(this.settings.className.grid).appendTo(container);
    }

    for (let p = 0; p < pages; p++) {
      if (pages > 1) {
        let pageColumn = $('<div/>').addClass(this.settings.className.column).appendTo(pageGrid);
        container = pageColumn;
      }

      let
        month = startMonth + p,
        firstMonthDayColumn = (new Date(year, month, 1).getDay() - this.settings.firstDayOfWeek % 7 + 7) % 7
      ;
      if (!this.settings.constantHeight && isDay) {
        let requiredCells = new Date(year, month + 1, 0).getDate() + firstMonthDayColumn;
        rows = Math.ceil(requiredCells / 7);
      }

      let
        yearChange = isYear ? 10 : isMonth ? 1 : 0,
        monthChange = isDay ? 1 : 0,
        dayChange = isHour || isMinute ? 1 : 0,
        prevNextDay = isHour || isMinute ? day : 1,
        prevDate = new Date(year - yearChange, month - monthChange, prevNextDay - dayChange, hour),
        nextDate = new Date(year + yearChange, month + monthChange, prevNextDay + dayChange, hour),
        prevLast = isYear ? new Date(Math.ceil(year / 10) * 10 - 9, 0, 0) :
          isMonth ? new Date(year, 0, 0) : isDay ? new Date(year, month, 0) : new Date(year, month, day, -1),
        nextFirst = isYear ? new Date(Math.ceil(year / 10) * 10 + 1, 0, 1) :
          isMonth ? new Date(year + 1, 0, 1) : isDay ? new Date(year, month + 1, 1) : new Date(year, month, day + 1)
      ;

      let tempMode = mode;
      if (isDay && this.settings.showWeekNumbers) {
        tempMode += ' andweek';
      }
      let table = $('<table/>').addClass(this.settings.className.table).addClass(tempMode).addClass(numberText[columns] + ' column').appendTo(container);
      if (this.isInverted) {
        table.addClass(this.settings.className.inverted);
      }
      let textColumns = columns;
      //no header for time-only mode
      if (!isTimeOnly) {
        let thead = $('<thead/>').appendTo(table);

        row = $('<tr/>').appendTo(thead);
        cell = $('<th/>').attr('colspan', '' + columns).appendTo(row);

        let
          headerDate = isYear || isMonth
            ? new Date(year, 0, 1)
            : isDay
              ? new Date(year, month, 1)
              : new Date(year, month, day, hour, minute),
          headerText = $('<span/>').addClass(this.settings.className.link).appendTo(cell)
        ;
        headerText.text(this.settings.formatter.header(headerDate, mode, this.settings));
        let newMode = isMonth
          ? (this.settings.disableYear ? 'day' : 'year')
          : isDay
            ? (this.settings.disableMonth ? 'year' : 'month')
            : 'day'
          ;
        headerText.data(this.settings.metadata.mode, newMode);

        if (p === 0) {
          let prev = $('<span/>').addClass(this.settings.className.prev).appendTo(cell);
          prev.data(this.settings.metadata.focusDate, prevDate);
          prev.toggleClass(this.settings.className.disabledCell, !this.helper_isDateInRange(prevLast, mode));
          $('<i/>').addClass(this.settings.className.prevIcon).appendTo(prev);
        }

        if (p === pages - 1) {
          let next = $('<span/>').addClass(this.settings.className.next).appendTo(cell);
          next.data(this.settings.metadata.focusDate, nextDate);
          next.toggleClass(this.settings.className.disabledCell, !this.helper_isDateInRange(nextFirst, mode));
          $('<i/>').addClass(this.settings.className.nextIcon).appendTo(next);
        }
        if (isDay) {
          row = $('<tr/>').appendTo(thead);
          if (this.settings.showWeekNumbers) {
              cell = $('<th/>').appendTo(row);
              cell.text(this.settings.text.weekNo);
              cell.addClass(this.settings.className.weekCell);
              textColumns--;
          }
          for (i = 0; i < textColumns; i++) {
            cell = $('<th/>').appendTo(row);
            cell.text(this.settings.formatter.dayColumnHeader((i + this.settings.firstDayOfWeek) % 7, this.settings));
          }
        }
      }

      let tbody = $('<tbody/>').appendTo(table);
      i = isYear ? Math.ceil(year / 10) * 10 - 9 : isDay ? 1 - firstMonthDayColumn : 0;
      for (let r = 0; r < rows; r++) {
        row = $('<tr/>').appendTo(tbody);
        if (isDay && this.settings.showWeekNumbers) {
            cell = $('<th/>').appendTo(row);
            cell.text(this.get_weekOfYear(year, month, i+1-this.settings.firstDayOfWeek));
            cell.addClass(this.settings.className.weekCell);
        }
        for (let c = 0; c < textColumns; c++, i++) {
          let cellDate = isYear
            ? new Date(i, month, 1, hour, minute)
            : isMonth
              ? new Date(year, i, 1, hour, minute)
              : isDay
                ? new Date(year, month, i, hour, minute)
                : isHour
                  ? new Date(year, month, day, i)
                  : new Date(year, month, day, hour, i * this.settings.minTimeGap),
            cellText = isYear
              ? i
              : isMonth
                ? this.settings.text.monthsShort[i]
                : isDay
                  ? cellDate.getDate()
                  : this.settings.formatter.time(cellDate, this.settings, true)
          ;
          cell = $('<td/>').addClass(this.settings.className.cell).appendTo(row);
          cell.text(cellText);
          cell.data(this.settings.metadata.date, cellDate);
          let
            adjacent = isDay && cellDate.getMonth() !== ((month + 12) % 12),
            disabled = (!this.settings.selectAdjacentDays && adjacent) || !this.helper_isDateInRange(cellDate, mode) || this.settings.isDisabled(cellDate, mode) || this.helper_isDisabled(cellDate, mode) || !this.helper_isEnabled(cellDate, mode),
            eventDate
          ;
          if (disabled) {
            let disabledDate = this.helper_findDayAsObject(cellDate, mode, this.settings.disabledDates);
            if (disabledDate !== null && disabledDate[this.settings.metadata.message]) {
              cell.attr("data-tooltip", disabledDate[this.settings.metadata.message]);
              cell.attr("data-position", disabledDate[this.settings.metadata.position] || tooltipPosition);
              if (disabledDate[this.settings.metadata.inverted] || (this.isInverted && disabledDate[this.settings.metadata.inverted] === undefined)) {
                cell.attr("data-inverted", '');
              }
              if (disabledDate[this.settings.metadata.variation]) {
                cell.attr("data-variation", disabledDate[this.settings.metadata.variation]);
              }
            }
          } else {
            eventDate = this.helper_findDayAsObject(cellDate, mode, this.settings.eventDates);
            if (eventDate !== null) {
              cell.addClass(eventDate[this.settings.metadata.class] || this.settings.eventClass);
              if (eventDate[this.settings.metadata.message]) {
                cell.attr("data-tooltip", eventDate[this.settings.metadata.message]);
                cell.attr("data-position", eventDate[this.settings.metadata.position] || tooltipPosition);
                if (eventDate[this.settings.metadata.inverted] || (this.isInverted && eventDate[this.settings.metadata.inverted] === undefined)) {
                  cell.attr("data-inverted", '');
                }
                if (eventDate[this.settings.metadata.variation]) {
                  cell.attr("data-variation", eventDate[this.settings.metadata.variation]);
                }
              }
            }
          }
          let
            active: boolean = this.helper_dateEqual(cellDate, date, mode),
            isToday: boolean = this.helper_dateEqual(cellDate, today, mode)
          ;
          cell.toggleClass(this.settings.className.adjacentCell, adjacent && !eventDate);
          cell.toggleClass(this.settings.className.disabledCell, disabled);
          cell.toggleClass(this.settings.className.activeCell, active && !(adjacent && disabled));
          if (!isHour && !isMinute) {
            cell.toggleClass(this.settings.className.todayCell, !adjacent && isToday);
          }

          // Allow for external modifications of each cell
          let cellOptions = {
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
        let
          todayRow = $('<tr/>').appendTo(tbody),
          todayButton = $('<td/>').attr('colspan', '' + columns).addClass(this.settings.className.today).appendTo(todayRow)
        ;
        todayButton.text(this.settings.formatter.today(this.settings));
        todayButton.data(this.settings.metadata.date, today);
      }

      this.update_focus(false, table);

      if (this.settings.inline) {
        this.refreshTooltips();
      }
    }
  }

  bind_events(): void {
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
      this.$input.on('keydown' + this.eventNamespace, this.event_keydown.bind(this));
    } else {
      this.$container.on('keydown' + this.eventNamespace, this.event_keydown.bind(this));
    }
  }

  unbind_events(): void {
    this.debug('Unbinding events');
    this.$container.off(this.eventNamespace);
    if (this.$input.length) {
      this.$input.off(this.eventNamespace);
    }
  }

  event_class_mutation(mutations): void {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        this.check_disabled();
      }
    });
  }

  event_inputBlur(): void {
    this.$container.removeClass(this.settings.className.active);
    if (this.settings.formatInput) {
      let
        date = this.get_date(),
        text = this.settings.formatter.datetime(date, this.settings)
      ;
      this.$input.val(text);
    }
    if (this.selectionComplete) {
      this.trigger_change();
      this.selectionComplete = false;
    }
  }

  event_inputChange() {
    let
      val = this.$input.val(),
      date = this.settings.parser.date(val, this.settings)
    ;
    this.set_date(date, false);
  }

  event_inputFocus() {
    this.$container.addClass(this.settings.className.active);
  }

  event_keydown(event) {
    let keyCode = event.which;
    if (keyCode === 27 || keyCode === 9) {
      //esc || tab
      this.popup.hide();
    }

    if (this.popup.is_visible()) {
      if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
        //arrow keys
        let
          mode = this.get_mode(),
          bigIncrement = mode === 'day' ? 7 : mode === 'hour' ? 4 : mode === 'minute' ? this.timeGap['column'] : 3,
          increment = keyCode === 37 ? -1 : keyCode === 38 ? -bigIncrement : keyCode == 39 ? 1 : bigIncrement
        ;
        increment *= mode === 'minute' ? this.settings.minTimeGap : 1;
        let
          focusDate = this.get_focusDate() || this.get_date() || new Date(),
          year = focusDate.getFullYear() + (mode === 'year' ? increment : 0),
          month = focusDate.getMonth() + (mode === 'month' ? increment : 0),
          day = focusDate.getDate() + (mode === 'day' ? increment : 0),
          hour = focusDate.getHours() + (mode === 'hour' ? increment : 0),
          minute = focusDate.getMinutes() + (mode === 'minute' ? increment : 0),
          newFocusDate = new Date(year, month, day, hour, minute)
        ;
        if (this.settings.type === 'time') {
          newFocusDate = this.helper_mergeDateTime(focusDate, newFocusDate);
        }
        if (this.helper_isDateInRange(newFocusDate, mode)) {
          this.set_focusDate(newFocusDate);
        }
      } else if (keyCode === 13) {
        //enter
        let
          mode = this.get_mode(),
          date = this.get_focusDate()
        ;
        if (date && !this.settings.isDisabled(date, mode) && !this.helper_isDisabled(date, mode) && this.helper_isEnabled(date, mode)) {
          this.selectDate(date);
        }
        //disable form submission:
        event.preventDefault();
        event.stopPropagation();
      }
    }

    if (keyCode === 38 || keyCode === 40) {
      //arrow-up || arrow-down
      event.preventDefault(); //don't scroll
      this.popup.show();
    }
  }

  event_mousedown(event) {
    if (this.$input.length) {
      //prevent the mousedown on the calendar causing the input to lose focus
      event.preventDefault();
    }
    this.isTouchDown = event.type.indexOf('touch') >= 0;
    let
      target = $(event.target),
      date = target.data(this.settings.metadata.date)
    ;
    if (date) {
      this.set_focusDate(date, false, true, true);
    }
  }

  event_mouseover(event) {
    let
      target = $(event.target),
      date = target.data(this.settings.metadata.date),
      mousedown: boolean = event.buttons === 1
    ;
    if (date) {
      this.set_focusDate(date, false, true, mousedown);
    }
  }

  event_mouseup(event) {
    //ensure input has focus so that it receives keydown events for calendar navigation
    this.focus();
    event.preventDefault();
    event.stopPropagation();
    this.isTouchDown = false;
    let target = $(event.target);
    if (target.hasClass("disabled")) {
      return;
    }
    let parent = target.parent();
    if (parent.data(this.settings.metadata.date) || parent.data(this.settings.metadata.focusDate) || parent.data(this.settings.metadata.mode)) {
      //clicked on a child element, switch to parent (used when clicking directly on prev/next <i> icon element)
      target = parent;
    }
    let
      date = target.data(this.settings.metadata.date),
      focusDate = target.data(this.settings.metadata.focusDate),
      mode = target.data(this.settings.metadata.mode)
    ;
    // if (date && settings.onSelect.call(this.element, date, this.get_mode()) !== false) {
    if (date && this.invokeCallback('visible').apply(this.element, date, this.get_mode()) !== false) {
      let forceSet = target.hasClass(this.settings.className.today);
      this.selectDate(date, forceSet);
    }
    else if (focusDate) {
      this.set_focusDate(focusDate);
    }
    else if (mode) {
      this.set_mode(mode);
    }
  }

  observeChanges() {
    if ('MutationObserver' in window) {
      this.classObserver  = new MutationObserver(this.event_class_mutation.bind(this));
      this.debug('Setting up mutation observer', this.classObserver);
      this.observe_class();
    }
  }

  observe_class() {
    if (this.$input.length && this.classObserver) {
      this.classObserver.observe(this.$element[0], {
        attributes : true
      });
    }
  }

  disconnect_classObserver() {
    if (this.$input.length && this.classObserver) {
      this.classObserver.disconnect();
    }
  }

  check_disabled() {
    this.$input.attr('tabindex', this.is_disabled() ? '-1' : '0');
  }

  // INVESTIGATE
  // popup(...args): any {
  //   return this.$activator.popup.apply(this.$activator, args);
  // }

  focus() {
    if (this.$input.length) {
      this.$input.trigger('focus');
    } else {
      this.$container.trigger('focus');
    }
  }

  blur() {
    if (this.$input.length) {
      this.$input.trigger('blur');
    } else {
      this.$container.trigger('blur');
    }
  }

  refresh() {
    this.create_calendar();
  }

  refreshTooltips(): void {
    let winWidth = $(window).width();
    this.$container.find('td[data-position]').each(function () {
      var cell = $(this);
      var tooltipWidth = window.getComputedStyle(cell[0], ':after').width.replace(/[^0-9\.]/g,'');
      var tooltipPosition = cell.attr('data-position');
      // use a fallback width of 250 (calendar width) for IE/Edge (which return "auto")
      var calcPosition = (winWidth - cell.width() - (parseInt(tooltipWidth,10) || 250)) > cell.offset().left ? 'right' : 'left';
      if (tooltipPosition.indexOf(calcPosition) === -1) {
        cell.attr('data-position',tooltipPosition.replace(/(left|right)/,calcPosition));
      }
    });
  }

  selectDate(date, forceSet: boolean = false) {
    this.verbose('New date selection', date);
    let
      mode = this.get_mode(),
      complete = forceSet || mode === 'minute' ||
      (this.settings.disableMinute && mode === 'hour') ||
      (this.settings.type === 'date' && mode === 'day') ||
      (this.settings.type === 'month' && mode === 'month') ||
      (this.settings.type === 'year' && mode === 'year')
    ;
    if (complete) {
      let canceled = this.set_date(date) === false;
      if (!canceled) {
        this.selectionComplete = true;
        if (this.settings.closable) {
          this.popup.hide();
          //if this is a range calendar, focus the container or input. This will open the popup from its event listeners.
          let endModule = this.get_calendarModule(this.settings.endCalendar);
          if (endModule) {
            if (endModule.setting('on') !== 'focus') {
              endModule.popup('show');
            }
            endModule.focus();
          }
        }
      }
    } else {
      let newMode = mode === 'year' ? (!this.settings.disableMonth ? 'month' : 'day') :
        mode === 'month' ? 'day' : mode === 'day' ? 'hour' : 'minute';
      this.set_mode(newMode);
      if (mode === 'hour' || (mode === 'day' && this.get_date())) {
        //the user has chosen enough to consider a valid date/time has been chosen
        this.set_date(date, true, false);
      } else {
        this.set_focusDate(date);
      }
    }
  }

  update_focus(updateRange, container: Cash = this.$container) {
    let
      mode = this.get_mode(),
      date = this.get_date(),
      focusDate = this.get_focusDate(),
      startDate = this.get_startDate(),
      endDate = this.get_endDate(),
      rangeDate = (updateRange ? focusDate : null) || date || (!this.isTouch ? focusDate : null),
      module: Calendar = this
    ;

    container.find('td').each(function () {
      let
        cell = $(this),
        cellDate = cell.data(module.settings.metadata.date)
      ;
      if (!cellDate) {
        return;
      }
      let
        disabled = cell.hasClass(module.settings.className.disabledCell),
        active = cell.hasClass(module.settings.className.activeCell),
        adjacent = cell.hasClass(module.settings.className.adjacentCell),
        focused = module.helper_dateEqual(cellDate, focusDate, mode),
        inRange = !rangeDate ? false :
          ((!!startDate && module.helper_isDateInRange(cellDate, mode, startDate, rangeDate)) ||
          (!!endDate && module.helper_isDateInRange(cellDate, mode, rangeDate, endDate)))
        ;
      cell.toggleClass(module.settings.className.focusCell, focused && (!module.isTouch || module.isTouchDown) && (!adjacent || (module.settings.selectAdjacentDays && adjacent)) && !disabled);

      if (module.helper_isTodayButton(cell)) {
        return;
      }
      cell.toggleClass(module.settings.className.rangeCell, inRange && !active && !disabled);
    });
  }

  trigger_change() {
    let inputElement = this.$input[0];
    if (inputElement) {
      let events = document.createEvent('HTMLEvents');
      this.verbose('Triggering native change event');
      events.initEvent('change', true, false);
      inputElement.dispatchEvent(events);
    }
  }

  changeDate(date) {
    this.set_date(date);
  }

  clear () {
    this.set_date(undefined);
  }

  is_disabled(): boolean {
    return this.$element.hasClass(this.settings.className.disabled);
  }

  get_calendarModule(selector) {
    if (!selector) {
      return null;
    }
    if (!(selector instanceof $)) {
      selector = $(selector).first();
    }
    //assume range related calendars are using the same namespace
    return selector.data(this.moduleNamespace);
  }

  get_date() {
    return this.helper_sanitiseDate(this.$element.data(this.settings.metadata.date)) || null;
  }

  get_endDate() {
    let endModule = this.get_calendarModule(this.settings.endCalendar);
    return (endModule ? endModule.get.date() : this.$element.data(this.settings.metadata.endDate)) || null;
  }

  get_focusDate() {
    return this.$element.data(this.settings.metadata.focusDate) || null;
  }

  get_inputDate() {
    return this.$input.val();
  }

  get_isTouch(): boolean {
    try {
      document.createEvent('TouchEvent');
      return true;
    }
    catch (e) {
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
    let mode = this.$element.data(this.settings.metadata.mode) || this.settings.startMode;
    return this.get_validatedMode(mode);
  }

  get_monthOffset() {
    return this.$element.data(this.settings.metadata.monthOffset) || 0;
  }

  get_startDate() {
    let startModule = this.get_calendarModule(this.settings.startCalendar);
    return (startModule ? startModule.get.date() : this.$element.data(this.settings.metadata.startDate)) || null;
  }

  get_type(): string {
    return this.$element.data(this.settings.metadata.type) || this.settings.type;
  }

  get_validatedMode(mode) {
    let validModes = this.get_validModes();
    // if ($.inArray(mode, validModes) >= 0) {
    if (validModes.indexOf(mode) >= 0) {
      return mode;
    }
    return this.settings.type === 'time' ? 'hour' :
      this.settings.type === 'month' ? 'month' :
        this.settings.type === 'year' ? 'year' : 'day';
  }

  get_validModes() {
    let validModes = [];
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
    let ms1d = 864e5, // milliseconds in a day
    ms7d = 7 * ms1d; // milliseconds in a week

    return function() { // return a closure so constants get calculated only once
      let
        DC3 = Date.UTC(weekYear, weekMonth, weekDay + 3) / ms1d, // an Absolute Day Number
        AWN = Math.floor(DC3 / 7), // an Absolute Week Number
        Wyr = new Date(AWN * ms7d).getUTCFullYear()
      ;

      return AWN - Math.floor(Date.UTC(Wyr, 0, 7) / ms7d) + 1;
    }();
  }

  set_dataKeyValue(key, value, refreshCalendar: boolean = false) {
    var oldValue = this.$element.data(key);
    var equal = oldValue === value || (oldValue <= value && oldValue >= value); //equality test for dates and string objects
    if (value) {
      this.$element.data(key, value);
    } else {
      this.$element.removeAttr(key);
    }
    refreshCalendar = refreshCalendar !== false && !equal;
    if (refreshCalendar) {
      this.refresh();
    }
    return !equal;
  }

  set_date(date, updateInput: boolean = false, fireChange: boolean = false) {
    date = this.helper_sanitiseDate(date);
    date = this.helper_dateInRange(date);

    let
      mode = this.get_mode(),
      text = this.settings.formatter.datetime(date, this.settings)
    ;

    // if (fireChange && this.settings.onBeforeChange.call(this.element, date, text, mode) === false) {
    if (fireChange && this.invokeCallback('beforeChange').apply(this.element, date, text, mode) === false) {
      return false;
    }

    this.set_focusDate(date);

    if (this.settings.isDisabled(date, mode)) {
      return false;
    }

    let endDate = this.get_endDate();
    if (!!endDate && !!date && date > endDate) {
      //selected date is greater than end date in range, so clear end date
      this.set_endDate(undefined);
    }
    this.set_dataKeyValue(this.settings.metadata.date, date);

    if (updateInput && this.$input.length) {
      this.$input.val(text);
    }

    if (fireChange) {
      // this.settings.onChange.call(this.element, date, text, mode);
      this.invokeCallback('change').call(this.element, date, text, mode);
    }
  }

  set_endDate(date, refreshCalendar: boolean = false) {
    date = this.helper_sanitiseDate(date);
    let endModule = this.get_calendarModule(this.settings.endCalendar);
    if (endModule) {
      endModule.set.date(date);
    }
    this.set_dataKeyValue(this.settings.metadata.endDate, date, refreshCalendar);
  }

  set_focusDate(date, refreshCalendar: boolean = false, updateFocus: boolean = false, updateRange: boolean = false) {
    date = this.helper_sanitiseDate(date);
    date = this.helper_dateInRange(date);
    let isDay = this.get_mode() === 'day';
    let oldFocusDate = this.helper_sanitiseDate(this.get_focusDate());
    if (isDay && date && oldFocusDate) {
      let yearDelta = date.getFullYear() - oldFocusDate.getFullYear();
      let monthDelta = yearDelta * 12 + date.getMonth() - oldFocusDate.getMonth();
      if (monthDelta) {
        let monthOffset = this.get_monthOffset() - monthDelta;
        this.set_monthOffset(monthOffset, false);
      }
    }
    let changed = this.set_dataKeyValue(this.settings.metadata.focusDate, date, !!date && refreshCalendar);
    updateFocus = (updateFocus !== false && changed && refreshCalendar === false) || this.focusDateUsedForRange != updateRange;
    this.focusDateUsedForRange = updateRange;
    if (updateFocus) {
      this.update_focus(updateRange);
    }
  }

  set_maxDate(date): void {
    date = this.helper_sanitiseDate(date);
    if (this.settings.minDate !== null && this.settings.minDate >= date) {
      this.verbose('Unable to set maxDate variable lower that minDate variable', date, this.settings.minDate);
    } else {
      this.setting('maxDate', date);
      this.set_dataKeyValue(this.settings.metadata.maxDate, date);
    }
  }

  set_minDate(date): void {
    date = this.helper_sanitiseDate(date);
    if (settings.maxDate !== null && this.settings.maxDate <= date) {
      this.verbose('Unable to set minDate variable bigger that maxDate variable', date, this.settings.maxDate);
    } else {
      this.setting('minDate', date);
      this.set_dataKeyValue(this.settings.metadata.minDate, date);
    }
  }

  set_mode(mode: string, refreshCalendar: boolean = false): void {
    this.set_dataKeyValue(this.settings.metadata.mode, mode, refreshCalendar);
  }

  set_monthOffset(monthOffset, refreshCalendar): void {
    let multiMonth = Math.max(settings.multiMonth, 1);
    monthOffset = Math.max(1 - multiMonth, Math.min(0, monthOffset));
    this.set_dataKeyValue(this.settings.metadata.monthOffset, monthOffset, refreshCalendar);
  }

  set_startDate(date, refreshCalendar): void {
    date = this.helper_sanitiseDate(date);
    let startModule = this.get_calendarModule(this.settings.startCalendar);
    if (startModule) {
      startModule.set.date(date);
    }
    this.set_dataKeyValue(this.settings.metadata.startDate, date, refreshCalendar);
  }

  helper_dateDiff(date1, date2, mode: string = 'day') {
    let
      isTimeOnly = this.settings.type === 'time',
      isYear = mode === 'year',
      isYearOrMonth = isYear || mode === 'month',
      isMinute = mode === 'minute',
      isHourOrMinute = isMinute || mode === 'hour'
    ;
    //only care about a minute accuracy of settings.minTimeGap
    date1 = this.helper_sanitiseDate(date1);
    date1 = new Date(
      isTimeOnly ? 2000 : date1.getFullYear(),
      isTimeOnly ? 0 : isYear ? 0 : date1.getMonth(),
      isTimeOnly ? 1 : isYearOrMonth ? 1 : date1.getDate(),
      !isHourOrMinute ? 0 : date1.getHours(),
      !isMinute ? 0 : this.settings.minTimeGap * Math.floor(date1.getMinutes() / this.settings.minTimeGap));
    date2 = this.helper_sanitiseDate(date2);
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

  helper_dateInRange(date, minDate = null, maxDate = null) {
    if (!minDate && !maxDate) {
      let startDate = this.get_startDate();
      minDate = startDate && this.settings.minDate ? new Date(Math.max(startDate, this.settings.minDate)) : startDate || this.settings.minDate;
      maxDate = this.settings.maxDate;
    }
    minDate = minDate && new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), minDate.getHours(), this.settings.minTimeGap * Math.ceil(minDate.getMinutes() / this.settings.minTimeGap));
    let isTimeOnly = this.settings.type === 'time';
    return !date ? date :
      (minDate && this.helper_dateDiff(date, minDate, 'minute') > 0) ?
        (isTimeOnly ? this.helper_mergeDateTime(date, minDate) : minDate) :
        (maxDate && this.helper_dateDiff(maxDate, date, 'minute') > 0) ?
          (isTimeOnly ? this.helper_mergeDateTime(date, maxDate) : maxDate) :
          date;
  }

  helper_findDayAsObject(date, mode: string, dates) {
    if (mode === 'day' || mode === 'month' || mode === 'year') {
      let d;
      for (let i = 0; i < dates.length; i++) {
        d = dates[i];
        if (typeof d === 'string') {
          d = this.helper_sanitiseDate(d);
        }
        if (d instanceof Date && this.helper_dateEqual(date, d, mode)) {
          let dateObject = {};
          dateObject[this.settings.metadata.date] = d;
          return dateObject;
        }
        else if (d !== null && typeof d === 'object') {
          if (d[this.settings.metadata.year]) {
            if (typeof d[this.settings.metadata.year] === 'number' && date.getFullYear() == d[this.settings.metadata.year]) {
              return d;
            } else if (Array.isArray(d[this.settings.metadata.year])) {
              if (d[this.settings.metadata.year].indexOf(date.getFullYear()) > -1) {
                return d;
              }
            }
          } else if (d[this.settings.metadata.month]) {
            if (typeof d[this.settings.metadata.month] === 'number' && date.getMonth() == d[this.settings.metadata.month]) {
              return d;
            } else if (Array.isArray(d[this.settings.metadata.month])) {
              if (d[this.settings.metadata.month].indexOf(date.getMonth()) > -1) {
                return d;
              }
            } else if (d[this.settings.metadata.month] instanceof Date) {
              var sdate = this.helper_sanitiseDate(d[this.settings.metadata.month]);
              if ((date.getMonth() == sdate.getMonth()) && (date.getFullYear() == sdate.getFullYear())) {
                return d;
              }
            }
          } else if (d[this.settings.metadata.date] && mode === 'day') {
            if (d[this.settings.metadata.date] instanceof Date && this.helper_dateEqual(date, this.helper_sanitiseDate(d[this.settings.metadata.date]), mode)) {
              return d;
            } else if (Array.isArray(d[this.settings.metadata.date])) {
              if (d[this.settings.metadata.date].some((idate) => { return this.helper_dateEqual(date, idate, mode); })) {
                return d;
              }
            }
          }
        }
      }
    }
    return null;
  }

  helper_isDateInRange(date, mode, minDate = null, maxDate = null) {
    if (!minDate && !maxDate) {
      let startDate = this.get_startDate();
      minDate = startDate && this.settings.minDate ? new Date(Math.max(startDate, this.settings.minDate)) : startDate || this.settings.minDate;
      maxDate = this.settings.maxDate;
    }
    minDate = minDate && new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), minDate.getHours(), this.settings.minTimeGap * Math.ceil(minDate.getMinutes() / this.settings.minTimeGap));
    return !(!date ||
    (minDate && this.helper_dateDiff(date, minDate, mode) > 0) ||
    (maxDate && this.helper_dateDiff(maxDate, date, mode) > 0));
  }

  helper_isDisabled(date, mode: string): boolean {
    return (mode === 'day' || mode === 'month' || mode === 'year') && ((mode === 'day' && this.settings.disabledDaysOfWeek.indexOf(date.getDay()) !== -1) || this.settings.disabledDates.some((d) => {
      if (typeof d === 'string') {
        d = this.helper_sanitiseDate(d);
      }
      if (d instanceof Date) {
        return this.helper_dateEqual(date, d, mode);
      }
      if (d !== null && typeof d === 'object') {
        if (d[this.settings.metadata.year]) {
          if (typeof d[this.settings.metadata.year] === 'number') {
            return date.getFullYear() == d[this.settings.metadata.year];
          } else if (Array.isArray(d[this.settings.metadata.year])) {
            return d[this.settings.metadata.year].indexOf(date.getFullYear()) > -1;
          }
        } else if (d[this.settings.metadata.month]) {
          if (typeof d[this.settings.metadata.month] === 'number') {
            return date.getMonth() == d[this.settings.metadata.month];
          } else if (Array.isArray(d[this.settings.metadata.month])) {
            return d[this.settings.metadata.month].indexOf(date.getMonth()) > -1;
          } else if (d[this.settings.metadata.month] instanceof Date) {
            let sdate = this.helper_sanitiseDate(d[this.settings.metadata.month]);
            return (date.getMonth() == sdate.getMonth()) && (date.getFullYear() == sdate.getFullYear())
          }
        } else if (d[this.settings.metadata.date] && mode === 'day') {
          if (d[this.settings.metadata.date] instanceof Date) {
            return this.helper_dateEqual(date, this.helper_sanitiseDate(d[this.settings.metadata.date]), mode);
          } else if (Array.isArray(d[this.settings.metadata.date])) {
            return d[this.settings.metadata.date].some(function(idate) {
              return this.helper_dateEqual(date, idate, mode);
            });
          }
        }
      }
    }));
  }

  helper_isEnabled(date, mode: string): boolean {
    if (mode === 'day') {
      return this.settings.enabledDates.length === 0 || this.settings.enabledDates.some((d) => {
        if (typeof d === 'string') {
          d = this.helper_sanitiseDate(d);
        }
        if (d instanceof Date) {
          return this.helper_dateEqual(date, d, mode);
        }
        if (d !== null && typeof d === 'object' && d[this.settings.metadata.date]) {
          return this.helper_dateEqual(date, this.helper_sanitiseDate(d[this.settings.metadata.date]), mode);
        }
      });
    } else {
      return true;
    }
  }

  helper_isTodayButton(element) {
    return element.text() === this.settings.text.today;
  }

  helper_mergeDateTime(date, time) {
    return (!date || !time) ? time :
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes());
  }

  helper_sanitiseDate(date) {
    if (!(date instanceof Date)) {
      date = this.settings.parser.date('' + date, this.settings);
    }
    if (!date || isNaN(date.getTime())) {
      return null;
    }
    return date;
  }
}
  