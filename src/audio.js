export class Audio {
  constructor() {this.enabled=true;}
  async start() {
    if(!this.ctx) {
      this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.24:0;this.master.connect(this.ctx.destination);
      const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate);const a=buffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;
      const noise=this.ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
      this.filter=this.ctx.createBiquadFilter();this.filter.type='bandpass';this.filter.Q.value=1.8;
      this.hiss=this.ctx.createGain();this.hiss.gain.value=0;noise.connect(this.filter);this.filter.connect(this.hiss);this.hiss.connect(this.master);noise.start();
      const engine=this.ctx.createOscillator();engine.type='sawtooth';engine.frequency.value=48;this.engineGain=this.ctx.createGain();this.engineGain.gain.value=0;const low=this.ctx.createBiquadFilter();low.frequency.value=100;engine.connect(low);low.connect(this.engineGain);this.engineGain.connect(this.master);engine.start();
    }
    await this.ctx.resume();
  }
  toggle(){this.enabled=!this.enabled;if(this.master)this.master.gain.setTargetAtTime(this.enabled?.24:0,this.ctx.currentTime,.02);return this.enabled;}
  update(urgency,playing){if(!this.ctx)return;const t=this.ctx.currentTime;this.filter.frequency.setTargetAtTime(400+urgency*2800,t,.04);this.hiss.gain.setTargetAtTime(playing?urgency*.65:0,t,.025);this.engineGain.gain.setTargetAtTime(playing?.10:0,t,.05);}
  success(index){if(!this.ctx)return;this.hiss.gain.cancelScheduledValues(this.ctx.currentTime);this.hiss.gain.setValueAtTime(0,this.ctx.currentTime);this.tone(380+index*150,.14,'sine',.32);setTimeout(()=>this.tone(620+index*180,.18,'sine',.19),70);}
  tone(f,d,type='sine',volume=.4){const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+d);}
  crash(){if(!this.ctx)return;this.update(0,false);this.tone(100,.65,'sawtooth',.9);this.tone(46,1,'triangle',.9);}
}
