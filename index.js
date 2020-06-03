const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');

const BUTTER_PREFIX = 'org.butter.provider'

const argsToQueryString = args =>
  args === {} ? '' :
    Object.keys(args)
      .reduce((a, c) => `${a}&${c}=${args[c]}`, '?')

const createIPFSforProvider = async (provider, args = {}) => {
  console.error('will load', provider, args)
  const Provider = require(provider);

  const I = new Provider(args);
  const ipfs = await IPFS.create({ repo: `./ipfs/${I.config.name}/repo` });
  const orbitdb = await OrbitDB.createInstance(ipfs);

  const argsString = argsToQueryString(args);
  const ipfsName = `${BUTTER_PREFIX}.${I.config.name}${argsString}`;

  const docs = await orbitdb.docs(`${ipfsName}.docs)`, { indexBy: I.config.uniqueId });
  const feed = await orbitdb.feed(`${ipfsName}.feed)`);
  console.error('resolved', ipfsName, docs.address.toString(), feed.address.toString());

  let page = 0;
  while (true) {
    console.error('getting', page);
    let { results, hasMore } = await I.fetch({ page });
    page++;
    for (let m of results) {
      await docs.put(m);
      await feed.add(m[I.config.uniqueId]);
    }

    if (!hasMore) break;
  }
}

createIPFSforProvider(process.argv[2])
