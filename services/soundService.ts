
const SFX_URLS = {
  CLICK: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  SLASH: "https://assets.mixkit.co/active_storage/sfx/2047/2047-preview.mp3",
  MAGIC: "https://assets.mixkit.co/active_storage/sfx/2034/2034-preview.mp3",
  HEAL: "https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3",
  SUMMON: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  VICTORY: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  DEFEAT: "https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3",
  RARE_GET: "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3",
  LEGEND_GET: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3"
};

class SoundService {
  private volume: number = 0.5;

  setVolume(volume: number) {
    this.volume = volume;
  }

  play(effect: keyof typeof SFX_URLS) {
    const audio = new Audio(SFX_URLS[effect]);
    audio.volume = this.volume;
    audio.play().catch(() => {
      // Ignore autoplay block
    });
  }
}

export const soundService = new SoundService();
