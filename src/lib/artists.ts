export const artists = [
  {
    name: "Gabriele Daugintyte",
    age: "21",
    description:
      "Gabriele Daugintyte is a 21 year old local artist. Her previous work thematically explores architecture through time, using transfer emulsion, to draw attention impermanence. Daugintyte’s current project investigates sonder - the awareness that every individual has a rich, unseen life just as our own. Influenced by Henri Cartier-Bresson’s focus on observation and the decisive moment, Daugintyte’s developed works continue to encourage close observation on the overlooked moments and subtle traces of presence.",
    instagram: "https://www.instagram.com/gabriele_d_/",
  },
  {
    name: "Julita Lipinska",
    age: "21",
    description:
      "Julita’s work focuses on the ever-changing relationship and perceptions of tattooing within our society and culture by highlighting tattooing as a form of art rather than body modification and translating the secret language of tattooing. Julita blurs the boundaries between tattooing and fine art opening up the conversation of “what is art?” Often inspired by artists like Aubrey Beardsley who focus on all things magical, mythological and grotesque.",
    instagram: "https://www.instagram.com/_julitalipinska_2004/",
  },
  {
    name: "Liam Walker",
    age: "25",
    description:
      "Liam's work focuses on character making that shows his own expression and personality. His comic book style is something he has been developing for over five years. He's inspired by artists that use comic art and those that use caricature (character) in their art like, Kenny Scharf, Takahi Murakami, Yui Karasuno. Liam's project focuses on how the world perceives people that have autism condition that makes their lives harder. By exploring consists of his personal experience living with autism through drawing that articulate the emotions and feelings in visual representation.",
    instagram: "https://www.instagram.com/artwalker.mystic/",
  },
  {
    name: "Victoria Wright",
    age: "38",
    description:
      "Victoria's work focuses on how we view themes such as mental health, emotions, and identity through the use of illusions. As someone with personal experiences of anxiety, emotional issues, and identity, Victoria knows that the emotions a person shows often do not match what people see. Victoria's art encourages viewers to question what they actually perceive when visually looking at the artwork. Victoria is inspired by artists such as Giuseppe Arcimboldo, Victor Vasarely, and contemporary artist Patrick Seymour. Her goal is to raise awareness of mental health, identity, and emotional struggles.",
    instagram: "https://www.instagram.com/victoriaexploresart/",
  },
  {
    name: "Ellie Seal",
    age: "21",
    description:
      "Ellie Seal is a twenty one year old local artist. Her practice mainly consists of oil paint, sculpting, and dance. As influence to her own work, Seal finds inspiration from artists such as Hilma Af klint and Wassily Kandinsky. Seal's project addresses an expression of her insecurities and causes through dance. With abstract shapes and colours Seal will create pieces with movement and powerful expression.",
    instagram: "https://www.instagram.com/small_wheels20/",
  },
  {
    name: "Freja Pearson",
    age: "20",
    description:
      "Freja Pearson has had a lifelong passion for art from a young age, she's been drawn to the creative process, finding joy through various mediums. While she has always gravitated toward painting with acrylics and printmaking, her work reflects a constant exploration of different forms of expression, recently drifting towards an interest in ceramics; exploring tactile art through a fusion of ceramics and painting, drawing on natural themes and organic forms to create richly textured, sensory-driven pieces. For this artist, creating is a journey, one that constantly pushes her to grow and discover new possibilities. ",
    instagram: "https://www.instagram.com/freja_vict",
  },
  {
    name: "Grace Chapman",
    age: "20",
    description:
      "Graces work consists of ball point pen drawings depicting human emotion. Her work aims to show personal interpretations of emotions through facial expressions. Grace draws inspiration from the faces she sees around her and societies perception of expression. Her portraits aim to reinvent an audiences idea of facial expressions and their correlation to emotions.",
    instagram: "https://www.instagram.com/g_portfolio05/",
  },
  {
    name: "Megan Latham",
    age: "33",
    description:
      "Meg’s work focuses on painting the female nude from her own perspective through large-scale, oil-painted self-portraiture. As a plus-size woman, she paints her body as it is, showing marks, texture, and physical realities that are often edited out of traditional representations of the nude. The scale of the work gives the body weight and presence, asking the viewer to really confront it rather than consume it. Influenced by painters such as Jenny Saville and Joan Semmel, her practice challenges the long history of women being positioned as objects in art, instead reclaiming the female body as something self-owned and self-defined.",
    instagram: "https://www.instagram.com/meglathamart",
  },
  {
    name: "Lou Ives",
    age: "35",
    description:
      "Louise's work focuses on print making showing different areas in her life that shows meaning and emotion. Louise is inspired by artists like Rembrandt and Francisco Goua. Louise's project focuses on confidence, empowerment and burlesque. Been a burlesque dancer Louise is a strong believer of women empowerment and not to be seen as objects.",
    instagram: "https://www.instagram.com/luxylou1",
  },
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
