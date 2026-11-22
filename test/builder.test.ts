import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PCBuildBuilder } from '../src/builder/PCBuildBuilder';
import { FullSystemDirector, PartsOnlyDirector, selectDirector } from '../src/builder/directors';
import { byId, byIds, GOOD_SYSTEM_IDS } from './helpers';

// Builder kalıbı testi: aynı builder, farklı Director'larla farklı istek türlerini kurar

test('Builder: aynı ürün iki kez eklenirse yalnızca bir kez sayılır', () => {
    const build = new PCBuildBuilder().addPart(byId(1)).addPart(byId(1)).addParts(byIds([1, 11])).build();

    assert.deepEqual(build.parts.map(p => p.id), [1, 11]);
});

test('Builder: toplam, verilen fiyatlarla hesaplanır; fiyatı olmayan ürün katalog fiyatıyla', () => {
    const build = new PCBuildBuilder().addParts(byIds([1, 11])).setPrices({ 1: 7000 }).build();

    assert.equal(build.totalPrice, 7000 + byId(11).price);
    assert.deepEqual(build.priceMap(), { 1: 7000, 11: byId(11).price });
});

test('FullSystemDirector: 8 kategorinin hepsi varsa tam sistemdir', () => {
    const build = new FullSystemDirector().construct(byIds(GOOD_SYSTEM_IDS), {});

    assert.equal(build.isFullSystem, true);
    assert.deepEqual(build.missingCategories, []);
});

test('FullSystemDirector: eksik kategoriler raporlanır ve sistem tam sayılmaz', () => {
    const withoutCooler = GOOD_SYSTEM_IDS.filter(id => id !== 61);
    const build = new FullSystemDirector().construct(byIds(withoutCooler), {});

    assert.equal(build.isFullSystem, false);
    assert.deepEqual(build.missingCategories, ['Cooler']);
});

test('FullSystemDirector: dahili grafikli işlemcide ekran kartı zorunlu değildir', () => {
    // i5-12400 (id 73) dahili grafikli; ekran kartı yok
    const build = new FullSystemDirector().construct(byIds([73, 21, 32, 41, 76, 57, 61]), {});

    assert.equal(build.isFullSystem, true);
    assert.deepEqual(build.missingCategories, []);
});

test('FullSystemDirector: dahili grafiği olmayan işlemcide ekran kartı eksikliği raporlanır', () => {
    // Ryzen 5 5600 (id 1) dahili grafikli değil
    const build = new FullSystemDirector().construct(byIds([1, 22, 32, 41, 51, 57, 61]), {});

    assert.equal(build.isFullSystem, false);
    assert.deepEqual(build.missingCategories, ['GPU']);
});

test('PartsOnlyDirector: tek parça isteğinde eksik kategori aranmaz, sistem asla tam sayılmaz', () => {
    const build = new PartsOnlyDirector().construct(byIds([11]), {});

    assert.equal(build.isFullSystem, false);
    assert.deepEqual(build.missingCategories, []);
    assert.equal(build.totalPrice, byId(11).price);
});

test('selectDirector: işlemci ve anakart varsa sistem, yoksa yalnızca parça isteğidir', () => {
    assert.ok(selectDirector(byIds(GOOD_SYSTEM_IDS)) instanceof FullSystemDirector);
    assert.ok(selectDirector(byIds([1, 22])) instanceof FullSystemDirector);
    assert.ok(selectDirector(byIds([11])) instanceof PartsOnlyDirector);
    assert.ok(selectDirector([]) instanceof PartsOnlyDirector);
});

test('PCBuild değişmezdir: Builder sonradan değişse de üretilmiş build etkilenmez', () => {
    const builder = new PCBuildBuilder().addPart(byId(1));
    const first = builder.build();
    builder.addPart(byId(11));

    assert.equal(first.parts.length, 1);
    assert.equal(builder.build().parts.length, 2);
});
