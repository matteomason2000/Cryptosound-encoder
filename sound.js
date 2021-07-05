// Piccola libreria di generazione suoni FM

export const FREQUENCIES = [
    261.63, //  0 - C
    277.18, //  1 - C#
    293.66, //  2 - D
    311.13, //  3 - D#
    329.63, //  4 - E
    349.23, //  5 - F
    369.99, //  6 - F#
    392.00, //  7 - G
    415.30, //  8 - G#
    440.00, //  9 - A
    466.16, // 10 - A#
    493.88  // 11 - B
]

export const SIN = "sine";
export const TRI = "triangle";
export const SAW = "sawtooth";
export const SQR = "square";

// Remove pool
const __pool = []

// t: tempo in secondi
// n: nota (0 = do)
export function tone(ac, dest, t, note, waveform=SIN) {

    const carrier_freq = FREQUENCIES[note % 12] * (Math.floor(note / 12) + 1)

    // carrier
    const c = new Osc(ac, t, waveform, carrier_freq, 1, 0);

    // modulator
    const modulator_gain = 0//Math.cos( t * 4.0) * 1000;
    const modulator_freq = carrier_freq//carrier_freq * Math.round((Math.cos( t * 4.5) + 1) * 10 + 1);
    const modulator_detune = 0//Math.sin( t * 0.8) * 10;
    const m = new Osc(ac, t, SIN, modulator_freq, modulator_gain, modulator_detune);
    m.gain.connect(c.osc.frequency);
    c.gain.connect(dest);

    // envelope function
    function env (gainNode, time) {
        const attack_duration  = 0.01;
        const decay_duration   = 0.01;
        const sustain_duration = 0.3;
        const release_duration = 0.01;
        const sustain          = 0.3;

        const v = gainNode.gain.value;
        //gainNode.gain.cancelScheduledValues(time);
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(v,           time + attack_duration);
        gainNode.gain.linearRampToValueAtTime(v * sustain, time + attack_duration + decay_duration);
        gainNode.gain.linearRampToValueAtTime(v * sustain, time + attack_duration + decay_duration + sustain_duration);
        gainNode.gain.linearRampToValueAtTime(0,           time + attack_duration + decay_duration + sustain_duration + release_duration);
    }

    // apply the (same) envelope to the carrier and the modulator
    env(m.gain, t);
    env(c.gain, t);

    // cleanup
    // TODO: make it better and take it out from here
    __pool.push(c);
    __pool.push(m);
    while(__pool.length >= 2096) {
        const o = __pool.shift();
        o.osc.stop();
        o.osc.disconnect();
        o.gain.disconnect();
    }
}

// Just an oscillator wrapper, connected to a gain node
class Osc {
    constructor(audio_ctx, t, type, freq, gain = 1, detune = 0){
        this.gain = audio_ctx.createGain();
        this.gain.gain.value = gain;

        this.osc = audio_ctx.createOscillator();
        this.osc.type = type;
        this.osc.frequency.value = freq;
        this.osc.detune.value = detune;

        this.osc.connect(this.gain);
        this.osc.start(t);
    }

    toString(){
        const f = + this.osc.frequency.value.toFixed(1);
        const g = this.gain.gain.value.toFixed(0);
        return "freq=" + f + " amp="+ g;
    }
}
