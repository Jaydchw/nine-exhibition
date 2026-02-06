import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { InstagramLogo } from "@phosphor-icons/react";
import { artistsWithSlugs } from "./lib/artists";
import Carousel from "./components/Carousel";
import ActionButton from "./components/ActionButton";

export default function ArtistPage() {
  const { slug } = useParams();
  const artist = artistsWithSlugs.find((entry) => entry.slug === slug);
  const artImages = useMemo(() => {
    if (!artist) return [];
    return [
      `/${artist.slug}/art1.png`,
      `/${artist.slug}/art2.png`,
      `/${artist.slug}/art3.png`,
    ];
  }, [artist]);

  const handleProfileError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const target = event.currentTarget;
    if (target.dataset.fallback === "done") return;
    if (target.src.endsWith(".png")) {
      target.dataset.fallback = "done";
      target.src = target.src.replace(/\.png$/, ".jpg");
      return;
    }
    target.dataset.fallback = "done";
  };
  return (
    <div className="min-h-screen bg-[#f7f4ef] px-6 py-16 md:px-10 md:py-24">
      <div className="max-w-4xl mx-auto">
        <ActionButton
          as={Link}
          to="/#exhibition"
          size="xs"
          className="tracking-[0.3em]"
        >
          Back to exhibition
        </ActionButton>

        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.35em] font-semibold text-neutral-500">
            Artist
          </p>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.08em] mt-2">
            {artist ? artist.name : "Artist not found"}
          </h1>
          <p className="text-sm uppercase tracking-[0.25em] font-semibold text-neutral-500 mt-3">
            Age: {artist?.age ?? "TBA"}
          </p>
          {artist?.instagram ? (
            <div className="mt-4">
              <ActionButton
                as="a"
                href={artist.instagram}
                target="_blank"
                rel="noreferrer"
                size="xs"
                aria-label={`${artist.name} on Instagram`}
              >
                <InstagramLogo size={18} />
                Instagram
              </ActionButton>
            </div>
          ) : null}
        </div>

        {artist ? (
          <div className="mt-10 grid divide-y-2 divide-black">
            <section className="py-8 flex flex-col items-center">
              <div className="w-full max-w-80 h-105 sm:max-w-90 sm:h-120 overflow-hidden bg-neutral-100 flex items-center justify-center mx-auto">
                <img
                  key={artist.slug}
                  src={`/${artist.slug}/artist.png`}
                  alt={`${artist.name} portrait`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={handleProfileError}
                />
              </div>
            </section>

            <section className="py-8">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.2em]">
                Description
              </h2>
              <p className="mt-4 text-base md:text-lg text-neutral-800 leading-relaxed">
                {artist.description ||
                  "Artist statement coming soon. This space will highlight the themes, materials, and process behind their work."}
              </p>
            </section>

            <section className="py-8">
              <Carousel
                key={`${artist.slug}-carousel`}
                images={artImages}
                altBase={`${artist.name} artwork`}
              />
            </section>
          </div>
        ) : (
          <p className="mt-6 text-base md:text-lg text-neutral-700">
            We could not find that artist.
          </p>
        )}
      </div>
    </div>
  );
}
