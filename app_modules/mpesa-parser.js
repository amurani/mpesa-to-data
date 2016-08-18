var exports = module.exports = {};

function getTimestamp(date, time) {
  var year = parseInt( date.split('/')[2] ) + 2000;
  var month = parseInt( date.split('/')[1] ) - 1;
  var day = date.split('/')[0];
  var hour = parseInt( time.match(/[0-9:]*/)[0].split(':')[0] ) - 1;
  if ( time.match(/ PM/) ) hour += 12;
  var minute = parseInt( time.match(/[0-9:]*/)[0].split(':')[1] ) - 1;

  return new Date( year, month, day, hour, minute ).getTime();
}

exports.mpesaParser = function ( mpesaMessages ) {
    var mpesaData = [];

    try {
      mpesaMessages = JSON.parse(mpesaMessages);
    } catch (err) {
      console.log(mpesaMessages);
    }

    mpesaMessages.forEach(function(mpesaMessage) {
      try {
        if (mpesaMessage.match(/m-shwari/i) != null) return;
        if (mpesaMessage.match(/balance was/i) != null) return;
        if (mpesaMessage.match(/menu/i) != null) return;
        if (mpesaMessage.match(/NoTransaction/i) != null) return;
        if (mpesaMessage.match(/Failed/i) != null) return;
        if (mpesaMessage.match(/delays/i) != null) return;
        if (mpesaMessage.match(/PIN/i) != null) return;
        if (mpesaMessage.match(/loan/i) != null) return;
        if (mpesaMessage.match(/secret/i) != null) return;
        if (mpesaMessage.match(/revers/i) != null) return;

        var transactions_code = mpesaMessage.match(/[A-Z0-9]+/)[0];
        var date = mpesaMessage.match(/\d*\/\d*\/\d*/)[0];
        var time = mpesaMessage.match(/\d*:\d* [a-zA-Z]{2}/)[0];
        var timestamp = getTimestamp(date, time);
        var money = mpesaMessage.match(/\d*,*\d*\.\d{2}/g);
        var amount = money[0].replace(/,/g, '');
        var balance = money[1].replace(/,/g, '');
        var type = mpesaMessage.match(/withdraw|received|sent|bought|give|paid/i)[0].toLowerCase();

        var extracted_data = {
          transaction_code: transactions_code,
          date: date,
          time: time,
          timestamp: timestamp,
          amount: parseFloat(amount),
          balance: parseFloat(balance),
          type: type,
          text: mpesaMessage
        };

        var party = null;

        if (type == 'withdraw') {
          party = mpesaMessage.match(/from [0-9A-z -'+]* New/);
          if (party == null)
            party = mpesaMessage.match(/from [0-9A-z -'+]*/)[0].replace(/from/, '').trim();
          else
            party = party[0].replace(/from /, '').replace(/ New/, '').trim();
        }

        if (type == 'sent') {
          party = mpesaMessage.match(/to [0-9A-z -'+]* for/);
          if (party == null)
            party = mpesaMessage.match(/to [0-9A-z -'+]* on/)[0].replace(/to /, '').replace(/ on/, '').trim();
          else
            party = party[0].replace(/to /, '').replace(/ for/, '').trim();
        }

        if (type == 'received') {
          party = mpesaMessage.match(/from [0-9A-z -'+]* on/);
          if (party == null) {
            party = mpesaMessage.match(/from\n[0-9A-z -'+]*/);
            if (party == null)
              party = mpesaMessage.match(/from\r[0-9A-z -'+]*/)[0].replace(/from\r/, '').trim();
            else
              party = party[0].replace(/from\n/, '').trim();
          } else
            party = party[0].replace(/from /, '').replace(/ on/, '').trim();
        }

        if (type == 'give') {
          party = mpesaMessage.match(/to [0-9A-z -'+]* New/)
          if (party == null)
            party = mpesaMessage.match(/to [0-9A-z -'+]*/)[0].replace(/to /, '').replace(/ New/, '').trim();
          else
            party = party[0].replace(/to /, '').replace(/ New/, '').trim();
        }


        if (type == 'bought') {
          party = mpesaMessage.match(/of [A-z]* on/);
          if (party == null)
            party = mpesaMessage.match(/of [A-z]* for/)[0].replace(/of /, '').replace(/ for/, '').trim();
          else
            party = party[0].replace(/of /, '').replace(/ on/, '').trim();
        }


        if (type == 'paid')
          party = mpesaMessage.match(/to [0-9A-z -]* on/)[0].replace(/to /, '').replace(/ on/, '').trim();

        extracted_data['party'] = party;

        mpesaData.push(extracted_data);
      } catch (err) {
        console.log(mpesaMessage);
      }
    });

    return mpesaData.reverse();
}
