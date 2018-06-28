import React from 'react';
import { mount, shallow } from 'enzyme';
import DatePicker from '../Datepicker';
import moment from 'moment-timezone';

describe('tests for <DatePicker />', () => {
  const TEST_DATE = '2018-04-01';
  let day;

  beforeAll(() => {
    // setting timezone to CST
    moment.tz.setDefault('Asia/Kolkata');
    day = moment(TEST_DATE);
  });

  afterAll(() => {
    moment.tz.setDefault();
  });

  it("should show the calendar when focusing on the date input", () => {
    const container = shallow(
      <DatePicker initialSelection={day}/>
    );
    expect(container).toMatchSnapshot();
  });

  it("should focus the initialSelection day if passed", () => {
    const container = mount(
      <DatePicker initialSelection={day}/>
    );
    container.find('input').simulate('mousedown');
    container.update();
    expect(container.find('.cui-button.cui-datepicker__day--focus').text()).toEqual("1");
  });

  it("on press of enter should select the date", () => {
    const container = mount(
      <DatePicker initialSelection={day} shouldCloseOnSelect={false}/>
    );
    container.find('input').simulate('mousedown');
    container.update();
    container.find('.cui-button.cui-datepicker__day--focus').simulate('click');
    expect(container.find('.cui-button.cui-datepicker__day--selected').text()).toEqual("1");
    expect(container.find('input').props().value).toEqual('04/01/2018');
  });

  it("when shouldCloseOnSelect is true should close the DatePicker", () => {
    const container = mount(
        <DatePicker initialSelection={day} shouldCloseOnSelect={true}/>
    );
    container.find('input').simulate('mousedown');
    container.update();
    container.find('.cui-button.cui-datepicker__day--focus').simulate('click');
    expect(container.find('.cui-event-overlay__children').length).toEqual(0);
    expect(container.find('input').props().value).toEqual('04/01/2018');
  });

  it("should handle keyBoard keys", () => {
    const container = mount(
        <DatePicker initialSelection={day} shouldCloseOnSelect={false}/>
    );
    container.find('input').simulate('mousedown');
    container.update();
    // right
    container.find('input').simulate('keydown', { which: 39 });
    expect(container.find('.cui-button.cui-datepicker__day--focus').text()).toEqual("2");
    // down
    container.find('input').simulate('keydown', { which: 40 });
    expect(container.find('.cui-button.cui-datepicker__day--focus').text()).toEqual("9");
    // up
    container.find('input').simulate('keydown', { which: 38 });
    expect(container.find('.cui-button.cui-datepicker__day--focus').text()).toEqual("2");
    // left
    container.find('input').simulate('keydown', { which: 37 });
    expect(container.find('.cui-button.cui-datepicker__day--focus').text()).toEqual("1");

    container.find('input').simulate('keydown', { which: 13 });
    expect(container.find('.cui-button.cui-datepicker__day--selected').text()).toEqual("1");
    expect(container.find('input').props().value).toEqual('04/01/2018');
  });

  it("onSelect/onChange callback should be called when a date is clicked", () => {
    let selectedDate;
    let changedDate;
    const onSelectFn = jest.fn(date => selectedDate = date);
    const onChangeFn = jest.fn(date => changedDate = date);
    const container = mount(
      <DatePicker
        initialSelection={day}
        onSelect={onSelectFn}
        onChange={onChangeFn}
      />
    );
    container.find('input').simulate('mousedown');
    container.update();
    container.find('.cui-button.cui-datepicker__day--focus').simulate('click');
    expect(onSelectFn).toHaveBeenCalled();
    expect(onChangeFn).toHaveBeenCalled();

    expect(selectedDate).toEqual(day);
    expect(changedDate).toEqual(day);
  });

  it("onChange callback should be called when a focused date changes", () => {
    let changedDate;
    const onChangeFn = jest.fn(date => changedDate = date);
    const container = mount(
      <DatePicker initialSelection={day} onChange={onChangeFn}/>
    );
    container.find('input').simulate('mousedown');
    container.update();
    //right
    container.find('input').simulate('keydown', { which: 39 });
    expect(container.find('.cui-button.cui-datepicker__day--focus').text()).toEqual("2");

    expect(onChangeFn).toHaveBeenCalled();
    expect(changedDate).toEqual(day.clone().add(1, 'day'));
  });

  it("onMonthChange callback should be called when a month switch happens", () => {
    let changedDate;
    const onMonthChangeFn = jest.fn(date => changedDate = date);
    const container = mount(
      <DatePicker initialSelection={day} onMonthChange={onMonthChangeFn}/>
    );
    container.find('input').simulate('mousedown');
    container.update();
    //next month
    container.find('.cui-button.cui-datepicker__navigation--buttons--next')
      .simulate('click');
    expect(changedDate).toEqual(day.clone().add(1, 'month'));
    expect(onMonthChangeFn).toHaveBeenCalledTimes(1);

    //prev month
    container.find('.cui-button.cui-datepicker__navigation--buttons--previous')
      .simulate('click');
    expect(changedDate).toEqual(day);
    expect(onMonthChangeFn).toHaveBeenCalledTimes(2);
  });

  it("when date is entered in input box, " +
  "should select that date if it is valid ", () => {
    let selectedDate;
    let changedDate;
    const onSelectFn = jest.fn(date => selectedDate = date);
    const onChangeFn = jest.fn(date => changedDate = date);
    const container = mount(
      <DatePicker
        initialSelection={day}
        onSelect={onSelectFn}
        onChange={onChangeFn}
      />
    );
    //open
    container.find('input').simulate('mousedown');
    // change date
    container.find('input')
      .simulate('change', { target: { value: "04/02/2018" } });
    expect(onSelectFn).toHaveBeenCalled();
    expect(onChangeFn).toHaveBeenCalled();

    expect(selectedDate.format('L')).toEqual("04/02/2018");
    expect(changedDate.format('L')).toEqual("04/02/2018");
  });

  it("when the datepicker is disabled, input tag should be disabled", () => {
    const container = mount(
      <DatePicker initialSelection={day} disabled/>
    );
    expect(container.find('input').props().disabled).toEqual(true);
  });

});
