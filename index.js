const NodeRSA = require('node-rsa');
const bigInt = require('big-integer');
const fs = require('fs');

const { spawn } = require('child_process');

const key = new NodeRSA({b: 512});
const { e, d, n } = key.keyPair;

fs.writeFile('./public.key', `(${e.toString(16)}, ${n.toString(16)})`, (err) => {
  if(!err){
    console.log('открытый ключ сгенерирован и сохранен в public.key!');
  }else{
    console.log(err);
  }
});

fs.writeFile('./private.key', `(${d.toString(16)}, ${n.toString(16)})`, (err) => {
  if(!err){
    console.log('закрытый ключ сгенерирован и сохранен в private.key!');
  }else{
    console.log(err);
  }
});

const genSymmetricKey = () => bigInt.randBetween(bigInt(10).pow(32), bigInt(10).pow(33).minus(1)).toString();

fs.readFile('./opentext.txt', (err, data) => {
  if(!err){
    const symmetricKey = genSymmetricKey();
    const encryptedKey = key.encrypt(Buffer.from(symmetricKey, 'utf8'), 'hex');

    const java = spawn('java', [
      'Main', 
      symmetricKey, 
      data
    ]);
    
    java.stdout.on('data', (stdoutdata) => {
      fs.writeFile('./symmetric_closed_key.txt', 
        encryptedKey, 
        (err) => {
          if(!err){
            console.log('ключ для симметричного шифрования открытого текста зашифрован и сохранен в symmetric_closed_key.txt');
          }else{
            console.log(err);
          }
        });

      fs.writeFile('./closedtext.txt', Buffer.from(stdoutdata, 'utf8').toString('hex'), (err) => {
        if(!err){
          console.log('открытый текст успешно зашифрован и сохранен в closedtext.txt');
        }else{
          console.log(err);
        }
      });
    });
    
    java.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
  }else{
    console.log(err);
  }
})
