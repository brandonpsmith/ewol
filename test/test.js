import { resolve } from "path";
import test from "ava";
import sinon from "sinon";
import { check } from "../src/main";

const configs = {
  empty: resolve(__dirname, "env.empty"),
  good: resolve(__dirname, "env.good"),
  bad: resolve(__dirname, "env.bad")
};

test("config does not exists", t => {
  sinon.stub(process, "exit");
  check();
  t.truthy(process.exit.isSinonProxy);
  sinon.assert.called(process.exit);
  sinon.assert.calledWith(process.exit, 1);
  process.exit.restore();
});

test("config has bad json", t => {
  sinon.stub(process, "exit");
  check({ config: configs.bad });
  t.truthy(process.exit.isSinonProxy);
  sinon.assert.called(process.exit);
  sinon.assert.calledWith(process.exit, 1);
  process.exit.restore();
});

test("config is empty", t => {
  check({ config: configs.empty });
  t.pass();
});

test("required environment variables ARE NOT set", t => {
  sinon.stub(process, "exit");
  check({ config: configs.good });
  t.truthy(process.exit.isSinonProxy);
  sinon.assert.called(process.exit);
  sinon.assert.calledWith(process.exit, 1);
  process.exit.restore();
});

test("required environment variable IS NOT set", t => {
  process.env["REQUIRED2"] = "some required value";
  sinon.stub(process, "exit");
  check({ config: configs.good });
  t.truthy(process.exit.isSinonProxy);
  sinon.assert.called(process.exit);
  sinon.assert.calledWith(process.exit, 1);
  process.exit.restore();
});

test("required environment variables ARE set", t => {
  process.env["REQUIRED1"] = "some required value";
  process.env["REQUIRED2"] = "some required value";
  check({ config: configs.good });
  t.pass();
});

test("default environment variables ARE set", t => {
  process.env["REQUIRED1"] = "some required value";
  process.env["REQUIRED2"] = "some required value";
  check({ config: configs.good });
  t.is(process.env["DEFAULT"], "some default value");
});
