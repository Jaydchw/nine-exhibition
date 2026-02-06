export const artists = [
  {
    name: "Gabriella Daugintyte",
    age: "20",
    description: "",
    instagram: "https://www.instagram.com/gabriele_d_/",
  },
  {
    name: "Julita Lipinska",
    age: "21",
    description: "",
    instagram: "https://www.instagram.com/_julitalipinska_2004/",
  },
  { name: "Liam Walker", age: "25", description: "", instagram: "" },
  { name: "Victoria Wright", age: "21", description: "", instagram: "" },
  {
    name: "Ellie Seal",
    age: "21",
    description:
      "Ellie Seal is a twenty one year old local artist. Her practice mainly consists of oil paint, sculpting, and dance. As influence to her own work, Seal finds inspiration from artists such as Hilma Af klint and Wassily Kandinsky. Seal's project addresses an expression of her insecurities and causes through dance. With abstract shapes and colours Seal will create pieces with movement and powerful expression.",
    instagram: "https://www.instagram.com/small_wheels20/",
  },
  { name: "Freja Pearson", age: "20", description: "", instagram: "" },
  { name: "Grace Chapman", age: "20", description: "", instagram: "" },
  { name: "Megan Latham", age: "30 something", description: "", instagram: "" },
  { name: "Lou Ives", age: "TBA", description: "", instagram: "" },
];

export const slugifyArtist = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const artistsWithSlugs = artists.map((artist) => ({
  ...artist,
  slug: slugifyArtist(artist.name),
}));
