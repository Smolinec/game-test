import { createInitialState } from '../src/engine/engine';
import { deserialize, serialize } from '../src/engine/save';
import { sha256Hex, signPayload, unwrapSigned, wrapSigned } from '../src/engine/signing';

const NOW = 1_700_000_000_000;

describe('SHA-256', () => {
  it('odpovídá známým vektorům', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('zvládá diakritiku a delší texty přes jeden blok', () => {
    expect(sha256Hex('Hvězdný důl 💎')).toHaveLength(64);
    expect(sha256Hex('a'.repeat(1000))).toBe('41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3');
  });
});

describe('podpis uložení', () => {
  it('podepsaná obálka se ověří a rozbalí', () => {
    const raw = wrapSigned('{"a":1}');
    const result = unwrapSigned(raw);
    expect(result).toEqual({ kind: 'signed', payload: '{"a":1}' });
  });

  it('upravený payload nebo podpis se odhalí', () => {
    const envelope = JSON.parse(wrapSigned('{"crystals":10}'));
    const tamperedPayload = JSON.stringify({ ...envelope, payload: '{"crystals":1e12}' });
    expect(unwrapSigned(tamperedPayload)).toEqual({ kind: 'tampered' });
    const tamperedSig = JSON.stringify({ ...envelope, sig: envelope.sig.replace(/^./, envelope.sig[0] === 'a' ? 'b' : 'a') });
    expect(unwrapSigned(tamperedSig)).toEqual({ kind: 'tampered' });
  });

  it('nepodepsaný JSON z dřívějška projde jako legacy, nesmysl je invalid', () => {
    expect(unwrapSigned('{"version":1,"crystals":5}')).toEqual({ kind: 'legacy', payload: '{"version":1,"crystals":5}' });
    expect(unwrapSigned('nope')).toEqual({ kind: 'invalid' });
    expect(unwrapSigned('[1,2]')).toEqual({ kind: 'invalid' });
  });

  it('podpis závisí na obsahu', () => {
    expect(signPayload('a')).not.toBe(signPayload('b'));
    expect(signPayload('a')).toBe(signPayload('a'));
  });
});

describe('serialize/deserialize s podpisem', () => {
  it('roundtrip funguje a uložení je podepsané', () => {
    const state = { ...createInitialState(NOW), crystals: 42 };
    const raw = serialize(state);
    expect(JSON.parse(raw)).toMatchObject({ sv: 1 });
    expect(deserialize(raw, NOW)).toEqual(state);
  });

  it('ručně upravené uložení se nenačte', () => {
    const state = { ...createInitialState(NOW), crystals: 42 };
    const envelope = JSON.parse(serialize(state));
    const hacked = JSON.stringify({ ...envelope, payload: envelope.payload.replace('"crystals":42', '"crystals":999999') });
    expect(deserialize(hacked, NOW)).toBeNull();
  });

  it('staré nepodepsané uložení se ještě načte', () => {
    const legacy = JSON.stringify({ version: 1, crystals: 7, generators: { drone: 1 } });
    const s = deserialize(legacy, NOW)!;
    expect(s.crystals).toBe(7);
    expect(s.generators).toEqual({ drone: 1 });
  });
});
