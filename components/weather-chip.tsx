import {
  formatObservedAt,
  formatWeatherLine,
  weatherEmoji,
  type CapsuleWeather,
} from "@/lib/weather";

export function WeatherChip({
  weather,
  label = "묻은 날의 날씨",
}: {
  weather: CapsuleWeather;
  label?: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-100/80 bg-white/70 px-4 py-3">
      <p className="text-[11px] tracking-[0.25em] text-amber-800/60 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm text-stone-700">
        <span className="mr-2 text-stone-400">{weatherEmoji(weather.sky)}</span>
        {formatWeatherLine(weather)}
      </p>
      {weather.observedAt ? (
        <p className="mt-1 text-xs text-stone-400">
          {formatObservedAt(weather.observedAt)}
        </p>
      ) : null}
    </div>
  );
}
