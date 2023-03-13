!(function (t) {
  "function" == typeof define && define.amd ? define(t) : t();
})(function () {
  "use strict";
  AFRAME.registerShader("fade", {
    schema: {
      color: { type: "vec3", is: "uniform" },
      intensity: { type: "number", default: 0, max: 1, min: 0, is: "uniform" },
    },
    vertexShader:
      "void main() {vec3 newPosition = position * 2.0;gl_Position = vec4(newPosition, 1.0);}",
    fragmentShader:
      "uniform vec3 color;uniform float intensity;void main() {gl_FragColor = vec4(color, intensity);}",
  }),
    AFRAME.registerPrimitive("al-snap-turn-fade", {
      defaultComponents: {
        material: { shader: "fade", transparent: !0, depthTest: !1 },
        geometry: { primitive: "plane" },
        "rotation-input": { property: "material.intensity" },
      },
      mappings: { "rotation-source": "rotation-input.source" },
    }),
    AFRAME.registerPrimitive("al-head-occlusion-fade", {
      defaultComponents: {
        material: { shader: "fade", transparent: !0, depthTest: !1 },
        geometry: { primitive: "plane" },
        "head-occlusion": { property: "material.intensity" },
      },
      mappings: { objects: "head-occlusion.objects" },
    }),
    AFRAME.registerComponent("head-occlusion", {
      schema: {
        objects: { type: "selectorAll" },
        property: { type: "string" },
        depth: { type: "number", default: 10, min: 1, max: 100 },
      },
      init: function () {},
      tick: (function () {
        const t = new THREE.Raycaster(),
          e = new THREE.Vector3(),
          i = new THREE.Vector3();
        return function (n, s) {
          if (!s || !this.data.property) return;
          const a = this.data.objects
            .map((t) => t.getObject3D("mesh"))
            .filter((t) => t);
          if (0 == a.length) return;
          const o = this.el.sceneEl.renderer.xr.getCamera();
          if (0 === o.cameras.length) return;
          e.setFromMatrixPosition(o.matrixWorld),
            i.set(0, -1, 0),
            e.addScaledVector(i, -this.data.depth),
            t.set(e, i),
            (t.far = this.data.depth);
          const r = t.intersectObjects(a, !0);
          e.setFromMatrixPosition(o.matrixWorld),
            i.multiplyScalar(-1),
            t.set(e, i);
          const c = t.intersectObjects(a, !0),
            h = r.length > c.length ? 1 : 0;
          AFRAME.utils.entity.setComponentProperty(
            this.el,
            this.data.property,
            h
          );
        };
      })(),
    }),
    AFRAME.registerComponent("motion-input", {
      schema: {
        source: { type: "selector" },
        property: { type: "string" },
        minOutput: { default: 0 },
        maxOutput: { default: 1 },
        ease: { default: 0.9, min: 0, max: 1 },
        inputMode: { default: "binary" },
      },
      init: function () {
        (this.input = 0),
          (this.motionEventHandler = (t) => {
            this.input = t.detail.inputMagnitude;
          }),
          this.data.source?.addEventListener("motion", this.motionEventHandler);
      },
      update: function (t) {
        t.source !== this.data.source &&
          (t.source?.removeEventListener("motion", this.motionEventHandler),
          this.data.source?.addEventListener("motion", this.motionEventHandler),
          (this.input = 0));
      },
      tick: (function () {
        let t = 0;
        return function (e, i) {
          if (!i || !this.data.property) return;
          let n = this.input;
          "binary" === this.data.inputMode && (n = n > 0 ? 1 : 0);
          const s =
            (n * (this.data.maxOutput - this.data.minOutput) +
              this.data.minOutput) *
              (1 - this.data.ease) +
            t * this.data.ease;
          AFRAME.utils.entity.setComponentProperty(
            this.el,
            this.data.property,
            s
          ),
            (t = s);
        };
      })(),
    }),
    AFRAME.registerComponent("nav-mesh-constrained", {
      schema: { offset: { type: "vec3" }, fallMode: { default: "snap" } },
      init: function () {
        this.navMeshSystem = this.el.sceneEl.systems["nav-mesh-locomotion"];
      },
      tick: (function () {
        const t = new THREE.Vector3(),
          e = new THREE.Vector3();
        return function (i, n) {
          if (!n || !this.navMeshSystem || !this.navMeshSystem.active) return;
          this.el.object3D.getWorldPosition(e), e.sub(this.data.offset);
          const s =
              "prevent" === this.data.fallMode
                ? (t, e) => t.y - e.y < 0.5
                : (t, e) => !0,
            a = this.navMeshSystem.approveMovement(t, e, s),
            o = a.result ? a.ground : a.position;
          o.add(this.data.offset),
            this.el.object3D.parent.worldToLocal(o),
            this.el.object3D.position.copy(o),
            this.el.object3D.getWorldPosition(t),
            t.sub(this.data.offset);
        };
      })(),
    }),
    AFRAME.registerComponent("rotation-input", {
      schema: {
        source: { type: "selector" },
        property: { type: "string" },
        minOutput: { default: 0 },
        maxOutput: { default: 1 },
        ease: { default: 0, min: 0, max: 1 },
        inputMode: { default: "analog" },
      },
      init: function () {
        (this.input = 0),
          (this.preRotationEventHandler = (t) => {
            this.input = t.detail.progress;
          }),
          (this.postRotationEventHandler = (t) => {
            this.input = 1 - t.detail.progress;
          }),
          this.data.source?.addEventListener(
            "prerotation",
            this.preRotationEventHandler
          ),
          this.data.source?.addEventListener(
            "postrotation",
            this.postRotationEventHandler
          );
      },
      update: function (t) {
        t.source !== this.data.source &&
          (t.source?.removeEventListener(
            "prerotation",
            this.preRotationEventHandler
          ),
          t.source?.removeEventListener(
            "postrotation",
            this.postRotationEventHandler
          ),
          this.data.source?.addEventListener(
            "prerotation",
            this.preRotationEventHandler
          ),
          this.data.source?.addEventListener(
            "postrotation",
            this.postRotationEventHandler
          ),
          (this.input = 0));
      },
      tick: (function () {
        let t = 0;
        return function (e, i) {
          if (!i || !this.data.property) return;
          let n = this.input;
          "binary" === this.data.inputMode && (n = n > 0 ? 1 : 0);
          const s =
            (n * (this.data.maxOutput - this.data.minOutput) +
              this.data.minOutput) *
              (1 - this.data.ease) +
            t * this.data.ease;
          AFRAME.utils.entity.setComponentProperty(
            this.el,
            this.data.property,
            s
          ),
            (t = s);
        };
      })(),
    }),
    AFRAME.registerShader("vignette", {
      schema: {
        intensity: {
          type: "number",
          default: 2,
          max: 10,
          min: 0,
          is: "uniform",
        },
      },
      vertexShader:
        "out vec2 coord;void main() {vec3 newPosition = position * 2.0;coord = vec2(newPosition.x, newPosition.y);gl_Position = vec4(newPosition, 1.0);}",
      fragmentShader:
        "uniform float intensity;in vec2 coord;void main() {float distance = length(coord);distance *= distance;distance *= intensity;gl_FragColor = vec4(0.0, 0.0, 0.0, distance);}",
    }),
    AFRAME.registerPrimitive("al-vignette", {
      defaultComponents: {
        material: { shader: "vignette", transparent: !0 },
        geometry: { primitive: "plane" },
        "motion-input": {
          property: "material.intensity",
          minOutput: 0,
          maxOutput: 2,
        },
      },
      mappings: {
        "motion-source": "motion-input.source",
        intensity: "motion-input.maxOutput",
      },
    }),
    AFRAME.registerComponent("gravity", {
      schema: { strength: { default: 9.81 } },
      inAir: !1,
      velocity: new THREE.Vector3(),
      init: function () {
        (this.motionEventHandler = (t) => {
          (this.inAir = t.detail.inAir),
            this.inAir || this.velocity.set(0, 0, 0);
        }),
          this.el.addEventListener("motion", this.motionEventHandler);
      },
      getVelocity: function () {
        return this.velocity;
      },
      tick: function (t, e) {
        this.inAir && (this.velocity.y -= (this.data.strength * e) / 1e3);
      },
      remove: function () {
        this.el.removeEventListener("motion", this.motionEventHandler);
      },
    });
  const t = ["gravity"];
  AFRAME.registerComponent("smooth-locomotion", {
    schema: {
      enabled: { default: !0 },
      target: { type: "selector" },
      reference: { type: "selector" },
      moveSpeed: { default: 1.5 },
      forward: { default: !0 },
      backward: { default: !0 },
      sideways: { default: !0 },
      inputMode: { default: "binary" },
      fallMode: { default: "fall" },
    },
    init: function () {
      (this.inputDirection = { x: 0, y: 0 }),
        (this.axisMoveListener = (t) => {
          const e = t.detail.axis;
          e.length > 2
            ? ((this.inputDirection.x = e[2]), (this.inputDirection.y = e[3]))
            : ((this.inputDirection.x = e[0]), (this.inputDirection.y = e[1]));
        }),
        this.el.addEventListener("axismove", this.axisMoveListener);
    },
    tick: (function () {
      const e = new THREE.Vector3(),
        i = new THREE.Quaternion(),
        n = new THREE.Vector3(),
        s = new THREE.Vector3(),
        a = new THREE.Vector3(),
        o = new THREE.Vector3(),
        r = new THREE.Vector3();
      return function (c, h) {
        if (!h || !this.data.enabled || !this.el.sceneEl.is("vr-mode")) return;
        e.set(this.inputDirection.x, 0, this.inputDirection.y),
          this.data.sideways || (e.x = 0),
          e.z < 0 && !this.data.backward
            ? (e.z = 0)
            : this.data.forward || (e.z = 0);
        const d =
          "binary" === this.data.inputMode
            ? Math.ceil(e.length())
            : Math.min(e.length(), 1);
        a.set(0, 0, 0);
        for (let e of t)
          this.data.target.hasAttribute(e) &&
            a.add(this.data.target.components[e].getVelocity());
        this.data.reference.object3D.getWorldQuaternion(i),
          e.applyQuaternion(i),
          (e.y = 0),
          e.normalize();
        const u = this.data.target.object3D.position;
        s.set(0, 0, 0)
          .addScaledVector(a, h / 1e3)
          .addScaledVector(e, (d * this.data.moveSpeed * h) / 1e3);
        let l = !1;
        const p = this.el.sceneEl.systems["nav-mesh-locomotion"];
        if (p && p.active) {
          this.data.reference.object3D.getWorldPosition(o),
            (o.y -= o.y - u.y),
            r.copy(o).add(s);
          const t =
              "prevent" === this.data.fallMode
                ? (t, e) => t.y - e.y < 0.5
                : (t, e) => !0,
            e = p.approveMovement(o, r, t),
            i = e.result ? e.position.y - e.ground.y : 100;
          "fall" === this.data.fallMode
            ? i < 0.5
              ? s.copy(e.ground)
              : ((l = !0), s.copy(e.position))
            : "snap" === this.data.fallMode
            ? s.copy(e.ground)
            : "prevent" === this.data.fallMode &&
              s.copy(e.result ? e.ground : e.position),
            s.sub(o);
        }
        n.copy(u).add(s),
          this.data.target.object3D.position.copy(n),
          this.data.target.emit(
            "motion",
            { inputMagnitude: d, inAir: l, source: this.el },
            !1
          );
      };
    })(),
    remove: function () {
      this.el.removeEventListener("axismove", this.axisMoveListener);
    },
  });
  const e = (function () {
    const t = new THREE.Vector3(),
      e = new THREE.Matrix4(),
      i = new THREE.Matrix4(),
      n = new THREE.Matrix4(),
      s = new THREE.Matrix4(),
      a = new THREE.Matrix4(),
      o = new THREE.Matrix4(),
      r = new THREE.Matrix4(),
      c = new THREE.Matrix4();
    return function (h, d, u) {
      if (!u || !h || !d) return;
      h.updateMatrixWorld(),
        n.copy(d.matrixWorld),
        a.copy(h.matrixWorld).getInverse(h.parent.matrixWorld);
      const l = e
        .makeRotationY((u * Math.PI) / 180)
        .multiply(i.extractRotation(n));
      if (
        (s
          .copy(l)
          .scale(t.setFromMatrixScale(n))
          .setPosition(t.setFromMatrixPosition(n)),
        o.multiplyMatrices(a, n),
        r.copy(o).getInverse(h.parent.matrixWorld),
        c.multiplyMatrices(s, r),
        h.parent)
      ) {
        const t = a.copy(h.parent.matrixWorld).getInverse(h.parent.matrixWorld);
        c.multiplyMatrices(t, c);
      }
      c.decompose(h.position, h.quaternion, h.scale);
    };
  })();
  AFRAME.registerComponent("smooth-turn", {
    schema: {
      enabled: { default: !0 },
      target: { type: "selector" },
      reference: { type: "selector" },
      turnSpeed: { default: 20 },
      inputMode: { default: "binary" },
    },
    init: function () {
      (this.input = 0),
        (this.axisMoveListener = (t) => {
          const e = t.detail.axis;
          this.input = e.length > 2 ? e[2] : e[0];
        }),
        this.el.addEventListener("axismove", this.axisMoveListener);
    },
    tick: function (t, i) {
      if (!(i && this.data.enabled && this.data.reference && this.data.target))
        return;
      if (Math.abs(this.input) <= 1e-5) return;
      let n = this.input;
      "binary" === this.data.inputMode && (n = n < 0 ? -1 : 1);
      const s = (-n * this.data.turnSpeed * i) / 1e3;
      this.data.target.emit("rotation", { degrees: s, source: this.el }),
        e(this.data.target.object3D, this.data.reference.object3D, s);
    },
    remove: function () {
      this.el.removeEventListener("axismove", this.axisMoveListener);
    },
  });
  AFRAME.registerComponent("snap-turn", {
    schema: {
      enabled: { default: !0 },
      target: { type: "selector" },
      reference: { type: "selector" },
      turnSize: { default: 45 },
      activateThreshold: { default: 0.9 },
      deactivateThreshold: { default: 0.8 },
      delay: { default: 0, min: 0 },
    },
    init: function () {
      (this.state = 0),
        (this.action = 0),
        (this.timer = 0),
        (this.nextAction = 0),
        (this.axisMoveListener = (t) => {
          const e = t.detail.axis,
            i = e.length > 2 ? e[2] : e[0];
          Math.abs(i) > this.data.activateThreshold
            ? (this.state = i < 0 ? 1 : 2)
            : Math.abs(i) < this.data.deactivateThreshold &&
              ((this.state = 0), 3 === this.action && (this.action = 0)),
            0 !== this.state &&
              0 === this.action &&
              (this.data.delay
                ? ((this.nextAction = this.state),
                  (this.timer = this.data.delay),
                  (this.action = 4))
                : (this.action = this.state));
        }),
        this.el.addEventListener("axismove", this.axisMoveListener);
    },
    tick: function (t, i) {
      if (!(i && this.data.enabled && this.data.reference && this.data.target))
        return;
      if (4 === this.action || 5 === this.action)
        if (((this.timer -= i / 1e3), this.timer < 0))
          this.action = this.nextAction;
        else {
          const t = 4 === this.action ? "prerotation" : "postrotation",
            e = (this.data.delay - this.timer) / this.data.delay;
          this.data.target.emit(t, { progress: e, source: this.el });
        }
      let n = 0;
      if (1 === this.action) n = this.data.turnSize;
      else {
        if (2 !== this.action) return;
        n = -this.data.turnSize;
      }
      this.data.target.emit("rotation", { degrees: n, source: this.el }),
        e(this.data.target.object3D, this.data.reference.object3D, n),
        (1 !== this.action && 2 !== this.action) ||
          (this.data.delay
            ? ((this.action = 5),
              (this.nextAction = 3),
              (this.timer = this.data.delay))
            : (this.action = 3));
    },
    remove: function () {
      this.el.removeEventListener("axismove", this.axisMoveListener);
    },
  });
  const i = (function () {
      const t = new THREE.Raycaster();
      return function (e, i, n) {
        return t.set(e, i), t.intersectObjects(n, !0);
      };
    })(),
    n = (function () {
      const t = new THREE.Vector3(),
        e = new THREE.Vector3(0, 0.5, 0),
        n = new THREE.Vector3(0, -1, 0);
      return {
        approveMovement: function (s, a, o, r) {
          t.copy(a).add(e);
          const c = i(t, n, o);
          if (0 === c.length || !r(a, c[0].point))
            return { result: !1, position: s };
          const h = c[0].point;
          return (
            h.y > a.y && (a.y = h.y), { result: !0, position: a, ground: h }
          );
        },
      };
    })(),
    s = [
      [0, 1],
      [0, 0.5],
      [30, 0.4],
      [-30, 0.4],
      [60, 0.2],
      [-60, 0.2],
      [80, 0.06],
      [-80, 0.06],
    ],
    a = (function () {
      const t = new THREE.Vector3(),
        e = new THREE.Vector3(0, 0.5, 0),
        n = new THREE.Vector3(0, -1, 0),
        a = new THREE.Vector3(),
        o = new THREE.Vector3();
      return {
        approveMovement: function (r, c, h, d) {
          const u = (s) => {
            t.addVectors(s, e);
            const a = i(t, n, h);
            return 0 !== a.length ? a[0].point : null;
          };
          o.subVectors(c, r);
          for (const [t, e] of s) {
            a.copy(o),
              a.applyAxisAngle(n, (t * Math.PI) / 180),
              a.multiplyScalar(e),
              a.add(r);
            const i = u(a);
            if (i && d(a, i))
              return (
                c.copy(a),
                i.y > c.y && (c.y = i.y),
                { result: !0, position: c, ground: i }
              );
          }
          return { result: !1, position: r };
        },
      };
    })(),
    o = { simple: n, scan: a };
  AFRAME.registerComponent("nav-mesh-strategy", {
    schema: { strategy: { default: "scan" } },
    init: function () {
      (this.navMeshSystem = this.el.sceneEl.systems["nav-mesh-locomotion"]),
        (this.navMeshSystem.active = !0),
        (this.updateStrategy = () => {
          const t = o[this.data.strategy] || n;
          this.navMeshSystem.switchStrategy(t);
        }),
        this.updateStrategy();
    },
    update: function (t) {
      t.strategy !== this.data.strategy && this.updateStrategy();
    },
  }),
    AFRAME.registerComponent("nav-mesh-locomotion", {
      schema: {},
      init: function () {
        
        this.el.addEventListener("model-loaded", (t) => {
          this.system.updateNavMeshes(this.el);
        }),
          this.system.registerNavMesh(this.el);
      },
      remove: function () {
        this.system.unregisterNavMesh(this.el);
      },
    }),
    AFRAME.registerSystem("nav-mesh-locomotion", {
      schema: {},
      active: !1,
      init: function () {
        (this.navMeshEntities = []),
          (this.navMeshes = []),
          (this.navMeshStrategy = null);
          
      },
      registerNavMesh: function (t) {
        this.navMeshEntities.push(t), this.updateNavMeshes();
      },
      unregisterNavMesh: function (t) {
        var e = this.navMeshEntities.indexOf(t);
        this.navMeshEntities.splice(e, 1), this.updateNavMeshes();
      },
      updateNavMeshes: function () {
        this.navMeshes = this.navMeshEntities
          .map((t) => t.getObject3D("mesh"))
          .filter((t) => t);
      },
      switchStrategy: function (t) {
        this.navMeshStrategy = t;
      },
      approveMovement: function (t, e, i) {
        return this.navMeshStrategy.approveMovement(
          t,
          e,
          this.navMeshes,
          i || (() => !0)
        );
      },
    });
});
