import 'rxjs/add/operator/takeUntil';

import { SimpleChanges } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import {
  ComponentInjectorComponent,
  getByPredicate,
  InjectedComponent,
  MockedInjectedComponent,
  TestComponent,
  TestModule,
} from '../test/index';
import { COMPONENT_INJECTOR } from './component-injector';
import { DynamicDirective } from './dynamic.directive';

const getComponentInjectorFrom = getByPredicate<ComponentInjectorComponent>(By.directive(ComponentInjectorComponent));
const getInjectedComponentFrom = getByPredicate<InjectedComponent>(By.directive(InjectedComponent));

describe('Directive: Dynamic', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent, ComponentInjectorComponent, DynamicDirective],
      providers: [{ provide: COMPONENT_INJECTOR, useValue: ComponentInjectorComponent }]
    });
  });

  describe('inputs', () => {
    let fixture: ComponentFixture<TestComponent>
      , injectorComp: ComponentInjectorComponent
      , injectedComp: MockedInjectedComponent;

    beforeEach(async(() => {
      const template = `<component-injector [ndcDynamicInputs]="inputs"></component-injector>`;
      TestBed.overrideComponent(TestComponent, { set: { template } });
      fixture = TestBed.createComponent(TestComponent);
      injectorComp = getComponentInjectorFrom(fixture).component;
      injectedComp = injectorComp.component;

      fixture.componentInstance['inputs'] = { prop1: 'prop1', prop2: 2 };
    }));

    it('should be passed to component', () => {
      fixture.detectChanges();

      expect(injectedComp['prop1']).toBe('prop1');
      expect(injectedComp['prop2']).toBe(2);
    });

    it('should trigger initially `OnChanges` life-cycle hook', () => {
      injectedComp.ngOnChanges.and.callFake((changes: SimpleChanges) => {
        expect(changes.prop1).toBeDefined();
        expect(changes.prop1.currentValue).toBe('prop1');
        expect(changes.prop1.isFirstChange()).toBeTruthy();
        expect(changes.prop2).toBeDefined();
        expect(changes.prop2.currentValue).toBe(2);
        expect(changes.prop2.isFirstChange()).toBeTruthy();
      });

      fixture.detectChanges();

      expect(injectedComp.ngOnChanges).toHaveBeenCalledTimes(1);
    });

    it('should trigger `OnChanges` life-cycle hook on updates', () => {
      fixture.detectChanges();

      expect(injectedComp.ngOnChanges).toHaveBeenCalledTimes(1);

      injectedComp.ngOnChanges.and.callFake((changes: SimpleChanges) => {
        expect(changes.prop1).toBeDefined();
        expect(changes.prop1.currentValue).toBe('123');
        expect(changes.prop1.isFirstChange()).toBeFalsy();
        expect(changes.prop2).toBeDefined();
        expect(changes.prop2.currentValue).toBe(2);
        expect(changes.prop2.isFirstChange()).toBeFalsy();
      });

      fixture.componentInstance['inputs'].prop1 = '123';
      fixture.detectChanges();

      expect(injectedComp.ngOnChanges).toHaveBeenCalledTimes(2);
    });

    it('should trigger `OnChanges` life-cycle hook if component instance was updated', () => {
      injectedComp.ngOnChanges.and.callFake((changes: SimpleChanges) => {
        expect(changes.prop1).toBeDefined();
        expect(changes.prop1.currentValue).toBe('prop1');
        expect(changes.prop1.isFirstChange()).toBeTruthy();
        expect(changes.prop2).toBeDefined();
        expect(changes.prop2.currentValue).toBe(2);
        expect(changes.prop2.isFirstChange()).toBeTruthy();
      });

      fixture.detectChanges();

      expect(injectedComp.ngOnChanges).toHaveBeenCalledTimes(1);

      let newInjectedComp = injectorComp.component = Object.assign({}, injectorComp.component);
      fixture.detectChanges();

      expect(newInjectedComp.ngOnChanges).toHaveBeenCalledTimes(2);
    });

    it('should NOT trigger `OnChanges` hook if not available on dynamic component', () => {
      delete injectedComp.ngOnChanges;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should NOT throw exception if inputs undefined', () => {
      fixture.componentInstance['inputs'] = undefined;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should NOT throw exception if inputs null', () => {
      fixture.componentInstance['inputs'] = null;
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('inputs with `NgComponentOutlet`', () => {
    let fixture: ComponentFixture<TestComponent>;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [TestModule],
        declarations: [DynamicDirective, TestComponent],
      });

      const template = `<ng-container [ngComponentOutlet]="comp" [ndcDynamicInputs]="inputs"></ng-container>`;
      TestBed.overrideComponent(TestComponent, { set: { template } });
      fixture = TestBed.createComponent(TestComponent);

      fixture.componentInstance['inputs'] = { prop1: '123', prop2: 1 };
      fixture.componentInstance['comp'] = InjectedComponent;
    }));

    it('should be passed to dynamic component instance', () => {
      fixture.detectChanges();

      const injectedComp = getInjectedComponentFrom(fixture).component;

      expect(injectedComp['prop1']).toBe('123');
      expect(injectedComp['prop2']).toBe(1);
    });
  });

  describe('inputs with `NgComponentOutlet` * syntax', () => {
    let fixture: ComponentFixture<TestComponent>;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [TestModule],
        declarations: [DynamicDirective, TestComponent],
      });

      const template = `<ng-container *ngComponentOutlet="comp; ndcDynamicInputs: inputs"></ng-container>`;
      TestBed.overrideComponent(TestComponent, { set: { template } });
      fixture = TestBed.createComponent(TestComponent);

      fixture.componentInstance['inputs'] = { prop1: '123', prop2: 1 };
      fixture.componentInstance['comp'] = InjectedComponent;
    }));

    it('should be passed to dynamic component instance', () => {
      fixture.detectChanges();

      const injectedComp = getInjectedComponentFrom(fixture).component;

      expect(injectedComp['prop1']).toBe('123');
      expect(injectedComp['prop2']).toBe(1);
    });
  });

  describe('outputs', () => {
    let fixture: ComponentFixture<TestComponent>
      , injectorComp: ComponentInjectorComponent
      , injectedComp: MockedInjectedComponent
      , outputSpy: jasmine.Spy;

    beforeEach(async(() => {
      const template = `<component-injector [ndcDynamicOutputs]="outputs"></component-injector>`;
      TestBed.overrideComponent(TestComponent, { set: { template } });
      fixture = TestBed.createComponent(TestComponent);
      injectorComp = getComponentInjectorFrom(fixture).component;
      injectedComp = injectorComp.component;
      outputSpy = jasmine.createSpy('outputSpy');

      fixture.componentInstance['outputs'] = { onEvent: outputSpy };
    }));

    it('should bind outputs to component and receive events', async(() => {
      fixture.detectChanges();

      injectedComp.onEvent.next('data');

      expect(outputSpy).toHaveBeenCalledTimes(1);
      expect(outputSpy).toHaveBeenCalledWith('data');
    }));

    it('should NOT bind outputs to component when outputs undefined', async(() => {
      fixture.componentInstance['outputs'] = undefined;

      expect(() => fixture.detectChanges()).not.toThrow();

      injectedComp.onEvent.next('data');

      expect(outputSpy).not.toHaveBeenCalled();
    }));

    it('should NOT bind outputs to component when outputs null', async(() => {
      fixture.componentInstance['outputs'] = null;

      expect(() => fixture.detectChanges()).not.toThrow();

      injectedComp.onEvent.next('data');

      expect(outputSpy).not.toHaveBeenCalled();
    }));

    it('should unbind outputs when component destroys', () => {
      const tearDownFn = jasmine.createSpy('tearDownFn');

      injectedComp.onEvent = new Observable(_ => tearDownFn) as any;

      fixture.detectChanges();

      injectorComp.component = null;
      fixture.detectChanges();

      expect(tearDownFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('outputs with `NgComponentOutlet`', () => {
    let fixture: ComponentFixture<TestComponent>
      , outputSpy: jasmine.Spy;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [TestModule],
        declarations: [DynamicDirective, TestComponent],
      });

      const template = `<ng-container [ngComponentOutlet]="comp" [ndcDynamicOutputs]="outputs"></ng-container>`;
      TestBed.overrideComponent(TestComponent, { set: { template } });
      fixture = TestBed.createComponent(TestComponent);

      outputSpy = jasmine.createSpy('outputSpy');

      InjectedComponent.prototype['onEvent'] = new Subject<any>();

      fixture.componentInstance['outputs'] = { onEvent: outputSpy };
      fixture.componentInstance['comp'] = InjectedComponent;
    }));

    afterEach(() => delete InjectedComponent.prototype['onEvent']);

    it('should be passed to dynamic component instance', () => {
      fixture.detectChanges();

      const injectedComp = getInjectedComponentFrom(fixture).component;

      injectedComp['onEvent'].next('data');

      expect(outputSpy).toHaveBeenCalledTimes(1);
      expect(outputSpy).toHaveBeenCalledWith('data');
    });
  });

  describe('outputs with `NgComponentOutlet` * syntax', () => {
    let fixture: ComponentFixture<TestComponent>
      , outputSpy: jasmine.Spy;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [TestModule],
        declarations: [DynamicDirective, TestComponent],
      });

      const template = `<ng-container *ngComponentOutlet="comp; ndcDynamicOutputs: outputs"></ng-container>`;
      TestBed.overrideComponent(TestComponent, { set: { template } });
      fixture = TestBed.createComponent(TestComponent);

      outputSpy = jasmine.createSpy('outputSpy');

      InjectedComponent.prototype['onEvent'] = new Subject<any>();

      fixture.componentInstance['outputs'] = { onEvent: outputSpy };
      fixture.componentInstance['comp'] = InjectedComponent;
    }));

    afterEach(() => delete InjectedComponent.prototype['onEvent']);

    it('should be passed to dynamic component instance', () => {
      fixture.detectChanges();

      const injectedComp = getInjectedComponentFrom(fixture).component;

      injectedComp['onEvent'].next('data');

      expect(outputSpy).toHaveBeenCalledTimes(1);
      expect(outputSpy).toHaveBeenCalledWith('data');
    });
  });
});
