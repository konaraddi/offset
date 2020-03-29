function saveData(
  money,
  tons,
  callback = () => {
    console.log(`update storage w/ ${money} and ${tons}`);
  }
) {
  chrome.storage.sync.set({ money, tons }, callback);
}

function getData(
  callback = ({ money, tons }) => {
    console.log(`storage contains ${money} and ${tons}`);
  }
) {
  chrome.storage.sync.get(["money", "tons"], data => callback(data));
}

setTimeout(() => {
  console.log(`CONTENT SCRIPT LOADED AT ${new Date().toLocaleTimeString()}`);

  // test
  saveData(12, 34, () => getData());

  const url = location.href;
  const isJetcom = url == "https://jet.com/checkout";
  const isAmericanAirlines =
    url.length > 56 &&
    url.substring(0, 56) ==
      "https://www.aa.com/booking/passengers?bookingPathStateId";

  if (!isJetcom && !isAmericanAirlines) {
    return;
  }

  if (isJetcom) {
    document.body.style.backgroundColor = "rgb(247, 247, 247)";
    document.getElementsByClassName(
      "base__Box-sc-1l64hnd-1 dlFWri"
    )[0].style.marginTop = "100px";
  }

  document.body.innerHTML =
    `
    <div class="box" style="background-color: #ebfffc;">
      <div class="container">
        <div id="app">
          <div class="level" v-if="!donated">
            <div class="level-left">
              <div class="level-item  has-text-centered">
                <h3 class="subtitle is-3 is-centered">
                  Donate 1% of your purchase to offset <strong>{{tons}}</strong> tonnes of carbon.
                </h3>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item  has-text-centered">
                <button class="button is-primary is-large" v-on:click="onDonate" v-bind:class="{'is-loading': isDonating}">Donate \${{money}}</button>
              </div>
              <!--
              <div class="level-item  has-text-centered">
                <button class="button is-large">Learn More</button>
              </div>
              -->
            </div>
          </div>
          <div class="level" v-else>
            <div class="level-item has-text-centered">
                <h3 class="subtitle is-3 is-centered">
                  Thank you for offsetting <strong>{{tons}}</strong> tonnes of carbon!
                </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
    ` + document.body.innerHTML;

  new Vue({
    el: "#app",
    data: {
      isDonating: false,
      donated: false
    },
    computed: {
      money() {
        if (isJetcom) {
          let costOfOrder = document
            .getElementsByClassName(
              "base__BaseStyledComponent-sc-1l64hnd-0 typography__Text-sc-1lwzhqv-0 kvuhxc"
            )[12]
            .innerHTML.substring(1);
          console.log(costOfOrder);
          return (0.01 * parseFloat(costOfOrder)).toFixed(2);
        }

        if (isAmericanAirlines) {
          let costOfOrder = document
            .getElementsByClassName("costSummary-price-number")[0]
            .innerHTML.trim()
            .substring(1);
          console.log(costOfOrder);
          return (0.01 * parseFloat(costOfOrder)).toFixed(2);
        }
      },
      tons() {
        return (this.money / 3.3).toFixed(2);
      }
    },
    methods: {
      onDonate: function(e) {
        console.log("clicked");
        this.isDonating = true;

        fetch("https://api.cloverly.com/2019-03-beta/purchases/currency", {
          method: "POST",
          headers: {
            Authorization: "Bearer public_key:728042ad434ec585",
            "Content-Type": "application/json"
          },
          body: `{"currency":{"value": ${this.money *
            100},"units":"usd cents"}}`
        }).then(res => {
          console.log(res);
          this.isDonating = false;
          this.donated = true;
        });
      }
    }
  });
}, 1500);
