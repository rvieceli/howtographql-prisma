function info() {
  return `This is the API of a hackernews clone from howtographql.com`;
}

async function feed(parent, { filter, skip, first, orderBy }, context) {
  const where = filter
    ? {
        OR: [{ description_contains: filter }, { url_contains: filter }]
      }
    : {};

  const links = await context.prisma.links({
    where,
    skip,
    first,
    orderBy
  });

  const count = await context.prisma
    .linksConnection({ where })
    .aggregate()
    .count();

  return {
    links,
    count
  };
}

function link(parent, { id }, context, info) {
  return context.prisma.link({ id });
}

module.exports = {
  info,
  feed,
  link
};
